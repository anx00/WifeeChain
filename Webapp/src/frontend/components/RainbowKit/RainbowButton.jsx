import { useEffect, useState } from 'react';
import { useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styled from 'styled-components';
import InternetTokenAddress from "../../contractsABI/InternetToken-address.json";

const ITK_ADDRESS = InternetTokenAddress.address; // Replace this with the actual ITK token contract address
const REFRESH_INTERVAL = 2000; // Refresh interval in milliseconds (5000ms = 5 seconds)

const Button = styled.button`
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  background-color: #495ab6;
  color: white;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #3873d9;
  }
  @media screen and (max-width: 468px) {
    font-size: 14px;
    padding: 6px;
  }
`;

const ConnectButtonStyled = styled(Button)`
  background-color: #3f51b5;
  &:hover {
    background-color: #2c3e50;
  }
`;

const WrongNetworkButtonStyled = styled(Button)`
  background-color: #f76c6c;
  &:hover {
    background-color: #e85c5c;
  }
`;

export const RainbowButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const address = account?.address;
        const [balanceData, setBalanceData] = useState(null);
        const { data: itkBalanceData, refetch } = useBalance({
          address,
          token: ITK_ADDRESS,
        });

        // useEffect(() => {
        //   setBalanceData(itkBalanceData);
        //   const interval = setInterval(() => {
        //     refetch();
        //   }, REFRESH_INTERVAL);

        //   return () => clearInterval(interval);
        // }, [itkBalanceData, refetch]);

        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        const displayITKBalance = balanceData?.formatted;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <ConnectButtonStyled onClick={openConnectModal} type="button">
                    Connect Wallet
                  </ConnectButtonStyled>
                );
              }
              if (chain.unsupported) {
                return (
                  <WrongNetworkButtonStyled onClick={openChainModal} type="button">
                    Wrong network
                  </WrongNetworkButtonStyled>
                );
              }
              return (
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* <Button
                    onClick={openChainModal}
                    style={{ display: 'flex', alignItems: 'center' }}
                    type="button"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 10, height: 10 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </Button> */}
                  <Button onClick={openAccountModal} type="button">
                    {account.displayName}
                    {/* {displayITKBalance
                      ? ` (${displayITKBalance} ITK)`
                      : ''} */}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
