


export const AboutPage = () => {
  return (
    <div className="w-[98%] md:w-72 h-100 md:max-h-72 overflow-y-scroll p-2 rounded-lg bg-black bg-opacity-50 backdrop-blur shadow-lg text-white">
      <h2 className="text-lg font-semibold mb-2">About</h2>
      <p className="text-sm text-gray-300 mb-4">
        Skybuds is a serene 3D world built around a floating island where
        digital life grows as visitors bring life to it.
        <br />
        <br />
        Visitors can create and accessorize and mint their own unique characters
        as NFTs, who then become permanent residents of the island. Watch as
        these little beings wander the landscape.
        <br />
        <br />
        Built with React, TypeScript, Three.js, and Tailwind CSS, Skybuds is a
        small personal project that blends interactive 3D experiences and web3
        technology.
      </p>
      <ul className="space-y-2">
        <li className="text-sm text-gray-300">
          Author:{' '}
          <a
            className="underline"
            target="_blank"
            href="https://benjylarcher.com"
          >
            Benjythebee
          </a>
        </li>
      </ul>
      <Credits />
    </div>
  )
}


export const Credits = () => {

    return (
            <details className="mt-2">
                <summary className="cursor-pointer text-lg font-semibold mb-2">Asset credits</summary>
                <div className="mt-2 text-sm text-gray-300">
                    All 3D models, textures, and sounds used in Skybuds are either original, licensed, or sourced from free asset libraries. Please contact for specific attribution details.
                </div>
                <ul className="text-sm">
                    {creditJson.map((credit, index) => (
                        <li key={index} className="mt-1">
                    <span className="font-semibold">{credit.name}</span> by <span className="italic">{credit.author}</span>
                    {credit.modified && <span className="text-xs text-gray-400"> (modified)</span>}
                    {credit.license && <span className="text-xs text-gray-400"> - {credit.license}</span>}
                    {credit.source && <span className="text-xs text-gray-400"> - Source: {credit.source}</span>}
                    </li>)
                )}
                </ul>
            </details>
    )

}


const creditJson = [
    {
        name: "Humanoid",
        author: "Yogoshimo 2.0",
        modified: "true",
        license:"CC-BY"
    },
    {
        name: "Post Lantern",
        author: "Kay lousberg",
        license: "CC0",
        modified: "true"
    },
    {
        name: "Bat wings",
        author: "Jeremy (polypizza)",
        license: "CC0",
        modified: "true"
    },
    {
        name: "Bowtie",
        author: "Jeremy",
        license: "CC0",
        modified: "true"
    },
    {
        name: "backpack",
        author: "Jeremy",
        license: "CC0",
        modified: "true"
    },
    {
        name: "Blue Sunglasses",
        author: "Jeremy",
        license: "CC-BY",
        source: "Poly Pizza",
        modified: "true"
    },
    {
        name: "Glasses",
        author: "Jeremy",
        license: "CC-BY",
        source: "Poly Pizza",
        modified: "true"
    },
    {
        name: "Frog Hat",
        author: "J-Toastie",
        license: "CC-BY",
        modified: "true"
    },
    {
        name: "Pixel Sunglasses",
        author: "TRASH - TANUKI",
        license: "CC-BY",
        modified: "true"
    },
    {
        name: "SFX: Cricket sound",
        author: "u_s8g68hg8n6",
        license: "CC0",
    },
    {
        name: "SFX: Campfire sound",
        author: "DRAGON_STUDIO",
        license: "CC0",
    },
    {
        name: "Floating island",
        author: "SteakByte"
    }

]
