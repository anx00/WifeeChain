import { ConnectKitButton } from "connectkit";
import { Types } from "connectkit";
import styled from "styled-components";
import { useAccount, useBalance } from "wagmi";

const StyledButton = styled.button`
  cursor: pointer;
  position: relative;
  display: inline-block;
  padding: 8px 16px;
  color: ${({ isConnected }) => (isConnected ? "#000000" : "#ffffff")};
  background: ${({ isConnected }) => (isConnected ? "#f2f2f2" : "#333333")};
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  box-shadow: 0 2px 12px -3px #333333;

  transition: 200ms ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 24px -6px ${({ isConnected }) =>
  isConnected ? "#f2f2f2" : "#333333"};
  }
  &:active {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px -4px ${({ isConnected }) =>
  isConnected ? "#e6e6e6" : "#333333"};
  }
`;

const StyledContainer = styled.div`
  display: flex;
  align-items: center;
`;

const StyledMiniButton = styled.div`
  margin-left: 8px;
  padding: 4px 8px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  background: #f2f2f2;
  color: #333333;
`;

export const ConnectKitCustomButton = () => {
  const { address } = useAccount();
  const { data: walletBalance, isError, isLoading } = useBalance({ address });
  console.log("walletBalance", walletBalance);

  return (
    <StyledContainer>
      <ConnectKitButton.Custom>
        {({ isConnected, show, truncatedAddress, ensName }) => {
          return (
            <StyledButton onClick={show} isConnected={isConnected}>
              {isConnected ? `${ensName ?? truncatedAddress}` : "Connect Wallet"}
            </StyledButton>
          );
        }}
      </ConnectKitButton.Custom>
      {walletBalance && (
        <StyledMiniButton>{`${walletBalance.formatted} ${walletBalance.symbol}`}</StyledMiniButton>
      )}
    </StyledContainer>
  );
};