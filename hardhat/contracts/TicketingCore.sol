// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@arcologynetwork/concurrentlib/lib/commutative/U256Cum.sol";
import "./ConcurrentERC721.sol";
import "./ConcurrentERC20.sol";

/**
 * @title TicketingCore
 * @notice Main event management contract for blockchain-based parallel ticketing system
 * @dev Uses Arcology's concurrent structures for parallel-safe ticket sales
 */
contract TicketingCore is ReentrancyGuard {
    // Payment token used for all ticket purchases
    ConcurrentERC20 public immutable paymentToken;

    // Event counter
    uint256 private _nextEventId;

    /**
     * @dev Tier structure for event tickets
     * @param name Tier name (e.g., "VIP", "Premium") - also used as NFT collection name
     * @param capacity Maximum number of tickets available in this tier
     * @param price Price per ticket in payment tokens
     * @param nftContract Address of the dedicated ConcurrentERC721 contract for this tier
     */
    struct Tier {
        string name;
        uint256 capacity;
        uint256 price;
        address nftContract;
    }

    /**
     * @dev Event structure
     * @param id Unique event identifier
     * @param name Event name
     * @param venue Event venue
     * @param timestamp Event timestamp (Unix time)
     * @param organizer Address of the event organizer
     * @param tiers Dynamic array of tiers (minimum 1, recommended max 5)
     */
    struct Event {
        uint256 id;
        string name;
        string venue;
        uint256 timestamp;
        address organizer;
        Tier[] tiers;
    }

    // Mapping from event ID to Event
    mapping(uint256 => Event) private _events;

    // Concurrent state tracking - separated from view-friendly structs
    // Mapping from eventId to revenue
    mapping(uint256 => U256Cumulative) private _eventRevenue;

    // Mapping from eventId to tierIdx to sold count
    mapping(uint256 => mapping(uint256 => U256Cumulative)) private _tierSold;

    // Events
    event EventCreated(
        uint256 indexed eventId,
        string name,
        string venue,
        uint256 timestamp,
        address indexed organizer,
        uint256 tierCount
    );

    event TicketPurchased(
        uint256 indexed eventId,
        uint256 indexed tierIdx,
        address indexed buyer,
        uint256 tokenId,
        uint256 price
    );

    event TicketRefunded(
        uint256 indexed eventId,
        uint256 indexed tierIdx,
        address indexed buyer,
        uint256 tokenId,
        uint256 refundAmount
    );

    event RevenueWithdrawn(
        uint256 indexed eventId,
        address indexed organizer,
        uint256 amount
    );

    /**
     * @dev Constructor
     * @param _paymentToken Address of the ERC20 token used for payments
     */
    constructor(address _paymentToken) {
        require(
            _paymentToken != address(0),
            "TicketingCore: payment token is zero address"
        );
        paymentToken = ConcurrentERC20(_paymentToken);
        _nextEventId = 1;
    }

    /**
     * @dev Temporary struct for passing tier configuration during event creation
     * @param name Tier name
     * @param capacity Maximum tickets for this tier
     * @param price Price per ticket in payment tokens
     */
    struct TierConfig {
        string name;
        uint256 capacity;
        uint256 price;
    }

    /**
     * @dev Creates a new event with dynamic tiers
     * @param name Event name
     * @param venue Event venue
     * @param timestamp Event timestamp (must be >12 hours in future)
     * @param tierConfigs Array of tier configurations (min 1, recommended max 5)
     * @return eventId The created event ID
     */
    function createEvent(
        string memory name,
        string memory venue,
        uint256 timestamp,
        TierConfig[] memory tierConfigs
    ) external returns (uint256 eventId) {
        // Validate timestamp is >12 hours in future
        require(
            timestamp > block.timestamp + 12 hours,
            "TicketingCore: event must be >12 hours in future"
        );

        // Validate tier count
        require(
            tierConfigs.length > 0,
            "TicketingCore: at least 1 tier required"
        );
        require(
            tierConfigs.length <= 5,
            "TicketingCore: max 5 tiers recommended"
        );

        // Generate event ID
        eventId = _nextEventId++;

        // Initialize event storage
        Event storage newEvent = _events[eventId];
        newEvent.id = eventId;
        newEvent.name = name;
        newEvent.venue = venue;
        newEvent.timestamp = timestamp;
        newEvent.organizer = msg.sender;

        // Initialize concurrent state tracking
        _eventRevenue[eventId] = new U256Cumulative(0, type(uint256).max);

        // Create tiers and deploy NFT contracts
        for (uint256 i = 0; i < tierConfigs.length; i++) {
            TierConfig memory config = tierConfigs[i];

            // Validate tier configuration
            require(
                config.capacity > 0,
                "TicketingCore: tier capacity must be > 0"
            );
            require(
                bytes(config.name).length > 0,
                "TicketingCore: tier name cannot be empty"
            );

            // Check tier name uniqueness by comparing with already added tiers
            for (uint256 j = 0; j < i; j++) {
                require(
                    keccak256(bytes(tierConfigs[j].name)) !=
                        keccak256(bytes(config.name)),
                    "TicketingCore: tier names must be unique"
                );
            }

            // Deploy dedicated ConcurrentERC721 contract for this tier
            ConcurrentERC721 tierNFT = new ConcurrentERC721(
                config.name,
                "TICKET"
            );

            // Create tier and add to event
            Tier memory newTier = Tier({
                name: config.name,
                capacity: config.capacity,
                price: config.price,
                nftContract: address(tierNFT)
            });

            newEvent.tiers.push(newTier);

            // Initialize concurrent sold counter for this tier
            _tierSold[eventId][i] = new U256Cumulative(0, config.capacity);
        }

        emit EventCreated(
            eventId,
            name,
            venue,
            timestamp,
            msg.sender,
            tierConfigs.length
        );
    }

    /**
     * @dev Purchase a ticket for an event
     * @param eventId The event ID
     * @param tierIdx The tier index to purchase from
     * @return tokenId The minted NFT token ID
     */
    function purchaseTicket(
        uint256 eventId,
        uint256 tierIdx
    ) external nonReentrant returns (uint256 tokenId) {
        // Validate event exists
        require(
            _events[eventId].id != 0,
            "TicketingCore: event does not exist"
        );

        Event storage eventData = _events[eventId];

        // Validate tier index
        require(
            tierIdx < eventData.tiers.length,
            "TicketingCore: invalid tier index"
        );

        Tier storage tier = eventData.tiers[tierIdx];

        // Transfer payment from buyer to contract
        // This will revert if buyer hasn't approved enough tokens
        paymentToken.transferFrom(msg.sender, address(this), tier.price);

        // Increment sold count - will revert if capacity exceeded (cumulative upper bound)
        _tierSold[eventId][tierIdx].add(1);

        // Increment revenue
        _eventRevenue[eventId].add(tier.price);

        // Mint NFT ticket from tier-specific collection
        ConcurrentERC721 tierNFT = ConcurrentERC721(tier.nftContract);
        tokenId = tierNFT.mint(msg.sender);

        emit TicketPurchased(eventId, tierIdx, msg.sender, tokenId, tier.price);
    }

    /**
     * @dev Refund a ticket before the refund deadline
     * @param eventId The event ID
     * @param tierIdx The tier index
     * @param tokenId The NFT token ID to refund
     */
    function refundTicket(
        uint256 eventId,
        uint256 tierIdx,
        uint256 tokenId
    ) external nonReentrant {
        // Validate event exists
        require(
            _events[eventId].id != 0,
            "TicketingCore: event does not exist"
        );

        Event storage eventData = _events[eventId];

        // Validate refund deadline
        require(
            block.timestamp < getRefundDeadline(eventId),
            "TicketingCore: refund deadline has passed"
        );

        // Validate tier index
        require(
            tierIdx < eventData.tiers.length,
            "TicketingCore: invalid tier index"
        );

        Tier storage tier = eventData.tiers[tierIdx];

        // Get tier NFT contract
        ConcurrentERC721 tierNFT = ConcurrentERC721(tier.nftContract);

        // Verify msg.sender owns the NFT
        require(
            tierNFT.ownerOf(tokenId) == msg.sender,
            "TicketingCore: caller is not NFT owner"
        );

        // Burn the NFT
        tierNFT.burn(tokenId);

        // Decrement sold count
        _tierSold[eventId][tierIdx].sub(1);

        // Decrement revenue
        _eventRevenue[eventId].sub(tier.price);

        // Transfer refund to buyer
        paymentToken.transfer(msg.sender, tier.price);

        emit TicketRefunded(eventId, tierIdx, msg.sender, tokenId, tier.price);
    }

    /**
     * @dev Withdraw revenue from an event (organizer only, after refund deadline)
     * @param eventId The event ID
     * @param amount The amount to withdraw
     */
    function withdrawRevenue(
        uint256 eventId,
        uint256 amount
    ) external nonReentrant {
        // Validate event exists
        require(
            _events[eventId].id != 0,
            "TicketingCore: event does not exist"
        );

        Event storage eventData = _events[eventId];

        // Validate caller is organizer
        require(
            msg.sender == eventData.organizer,
            "TicketingCore: caller is not organizer"
        );

        // Validate refund deadline has passed
        require(
            block.timestamp >= getRefundDeadline(eventId),
            "TicketingCore: refund deadline has not passed"
        );

        // Deduct from revenue - will revert if amount exceeds available revenue (cumulative lower bound)
        _eventRevenue[eventId].sub(amount);

        // Transfer tokens to organizer
        paymentToken.transfer(msg.sender, amount);

        emit RevenueWithdrawn(eventId, msg.sender, amount);
    }

    /**
     * @dev Returns the refund deadline for an event (event time - 12 hours)
     * @param eventId The event ID
     * @return The refund deadline timestamp
     */
    function getRefundDeadline(uint256 eventId) public view returns (uint256) {
        require(
            _events[eventId].id != 0,
            "TicketingCore: event does not exist"
        );
        return _events[eventId].timestamp - 12 hours;
    }

    /**
     * @dev Checks if refunds are currently allowed for an event
     * @param eventId The event ID
     * @return True if refunds are allowed, false otherwise
     */
    function canRefund(uint256 eventId) public view returns (bool) {
        require(
            _events[eventId].id != 0,
            "TicketingCore: event does not exist"
        );
        return block.timestamp < getRefundDeadline(eventId);
    }

    /**
     * @dev Gets the available revenue for withdrawal
     * @param eventId The event ID
     * @return The available revenue amount
     */
    function getAvailableRevenue(
        uint256 eventId
    ) public view returns (uint256) {
        require(
            _events[eventId].id != 0,
            "TicketingCore: event does not exist"
        );
        return _eventRevenue[eventId].get();
    }

    /**
     * @dev Gets tier availability information
     * @param eventId The event ID
     * @param tierIdx The tier index
     * @return sold Number of tickets sold
     * @return capacity Total capacity
     */
    function getTierAvailability(
        uint256 eventId,
        uint256 tierIdx
    ) public view returns (uint256 sold, uint256 capacity) {
        require(
            _events[eventId].id != 0,
            "TicketingCore: event does not exist"
        );
        require(
            tierIdx < _events[eventId].tiers.length,
            "TicketingCore: invalid tier index"
        );

        Tier storage tier = _events[eventId].tiers[tierIdx];
        return (_tierSold[eventId][tierIdx].get(), tier.capacity);
    }

    /**
     * @dev Gets complete event details
     * @param eventId The event ID
     * @return Event memory structure
     */
    function getEventDetails(
        uint256 eventId
    ) public view returns (Event memory) {
        require(
            _events[eventId].id != 0,
            "TicketingCore: event does not exist"
        );
        return _events[eventId];
    }
}
