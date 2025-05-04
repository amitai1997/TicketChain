import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await upgrades.deployProxy(TicketNFT, [], {
    initializer: "initialize",
    kind: "uups"
  });

  await ticketNFT.deployed();

  console.log("TicketNFT deployed to:", ticketNFT.address);
  console.log("Deployment transaction hash:", ticketNFT.deployTransaction.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
