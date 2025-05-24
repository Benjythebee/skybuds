# Skybuds 🌤️

A serene 3D interactive world built around a floating island where digital life grows as visitors bring life to it. Create, customize, and mint unique characters as NFTs who then become permanent residents of the magical island.

## ✨ Features

- **Character Creation**: Design unique characters with customizable traits (speed, laziness, talkativeness, color)
- **Wearable System**: Dress up your characters with hats, glasses, backpacks, and accessories
- **NFT Integration**: Mint your characters as NFTs on the Base blockchain
- **AI-like Behaviors**: Watch characters wander, interact, and converse with each other
- **Spatial Audio**: Immersive soundscape with crickets, campfire, and ambient sounds
- **Web3 Wallet Support**: Connect with popular wallets via RainbowKit
- **Guest Mode**: Try the experience without a wallet

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Three.js for 3D graphics
- Tailwind CSS for styling
- Vite for build tooling

**Web3:**
- wagmi + RainbowKit for wallet integration
- Base blockchain (Base Mainnet + testnet) See Below for more information on the contracts
- Custom Solidity contracts for NFT minting

**Backend:**
- Go-based serverless functions (via DigitalOcean)
- Alchemy API for blockchain data fetching

**3D Assets:**
- Custom 3D models and animations
- Spatial audio system
- Dynamic lighting and effects

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Web3 wallet (MetaMask, etc.)

## 🏗️ Project Structure

```
skybuds/
├── contracts/                 # Solidity smart contracts
│   ├── MetadataEncoding.sol  # Metadata encoding/decoding
│   ├── SkyBuds.sol          # Main NFT contract
│   └── SkybudsMetadata.sol  # Metadata management
├── serverless/               # Go serverless functions
│   └── packages/skybuds/    # Blockchain data fetching
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Core game logic
│   │   ├── Walker.ts       # Character behavior system
│   │   ├── World.ts        # 3D world management
│   │   ├── wearables/      # Wearable item system
│   │   └── utils/          # Utility functions
│   ├── menu/               # UI menus and overlays
│   ├── store/              # State management
│   └── web3/               # Blockchain integration
└── public/
    ├── assets/             # 3D models (.glb files)
    ├── audio/              # Sound effects
    └── images/             # Textures and images
```

## 🔧 Smart Contracts

The project uses two main contracts deployed on Base:

- **SkyBuds.sol**: Main ERC-721 NFT contract for minting
- **SkybudsMetadata.sol**: Handles metadata encoding and token URI generation

Metadata is efficiently packed into a single `uint256` containing:
- Wearable IDs (10 slots × 10 bits each)
- Talkative flag (1 bit)  
- Speed value (7 bits)
- Laziness value (7 bits)
- Color value (24 bits RGB)

## 🎨 Asset Credits

All 3D models, textures, and sounds are either original, licensed, or from free asset libraries:

- **Character Model**: Modified from Yogoshimo 2.0 (CC-BY)
- **Island Environment**: Original by SteakByte
- **Various Wearables**: Mix of original and CC-licensed assets from Poly Pizza
- **Audio**: CC0 cricket sounds and campfire audio

See the full credits in the About section of the application.

### Smart Contracts
Deploy using Hardhat or your preferred deployment tool to Base network.

## 🔗 Links

- **Live Demo**: [skybuds.benjylarcher.com](https://skybuds.benjylarcher.com)
- **Twitter**: [@benjythebee](https://x.com/benjythebee)

