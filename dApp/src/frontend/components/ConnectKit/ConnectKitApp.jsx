import { WagmiConfig, createClient } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, bscTestnet, hardhat } from "wagmi/chains";
import {
  ConnectKitProvider,
  ConnectKitButton,
  getDefaultClient,
} from "connectkit";
import { ConnectKitDisplay } from "./ConnectKitDisplay";
import { ConnectKitCustomButton } from "./ConnectKitCustomButton";

const alchemyId = "GAN8QEHw7aClYKxWJvAGFhsIL7lLde46";

const chains = [mainnet, polygon, optimism, arbitrum, hardhat];

const client = createClient(
  getDefaultClient({
    appName: "Your App Name",
    alchemyId,
    chains,
  })
);

export function ConnectKitApp() {
  return (
    <div>
      <WagmiConfig client={client}>
        <ConnectKitProvider theme="auto" mode="light">
          <ConnectKitCustomButton />
        </ConnectKitProvider>
      </WagmiConfig>
    </div>
  );
}