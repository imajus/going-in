import { Link } from 'react-router-dom'

export default function Navigation() {
  return (
    <nav className="border-b p-6">
      <p className="text-4xl font-bold">Metaverse Marketplace</p>
      <div className="flex mt-4 justify-between items-center">
        <div className="flex">
          <Link to="/" className="mr-4 text-pink-500">
            Home
          </Link>
          <Link to="/create-nft" className="mr-6 text-pink-500">
            Sell NFT
          </Link>
          <Link to="/my-nfts" className="mr-6 text-pink-500">
            My NFTs
          </Link>
          <Link to="/dashboard" className="mr-6 text-pink-500">
            Dashboard
          </Link>
        </div>
        <appkit-button />
      </div>
    </nav>
  )
}