#!/bin/bash

# Flushing all rules
sudo iptables -F
sudo iptables -X
sudo iptables -t nat -F
sudo iptables -t nat -X
sudo iptables -t mangle -F
sudo iptables -t mangle -X

# Setting default filter policy
sudo iptables -P INPUT ACCEPT
sudo iptables -P OUTPUT ACCEPT
sudo iptables -P FORWARD DROP

# Traffic from and to the Pi for wlan1
sudo iptables -A INPUT -i wlan1 -j ACCEPT
sudo iptables -A OUTPUT -o wlan1 -j ACCEPT
sudo iptables -A OUTPUT -o wlan1 -m state --state NEW,ESTABLISHED -j ACCEPT

# Allow DNS queries
sudo iptables -A FORWARD -i wlan1 -p udp --dport 53 -j ACCEPT
sudo iptables -A FORWARD -i wlan1 -p tcp --dport 53 -j ACCEPT

# Resolve ngrok hostname to IPs
NGROK_IPS=$(dig +short ngrok-free.app)

# Allow preauthenticated users to access ngrok
for ip in $NGROK_IPS; do
  sudo iptables -A FORWARD -i wlan1 -d $ip -j ACCEPT
done

# Resolve WalletConnect hostname to IPs
WC_IPS=$(dig +short bridge.walletconnect.org)

# Allow preauthenticated users to access WalletConnect
for ip in $WC_IPS; do
  sudo iptables -A FORWARD -i wlan1 -d $ip -j ACCEPT
done

# Resolve Infura hostname to IPs
INFURA_IPS=$(dig +short mainnet.infura.io)

# Allow preauthenticated users to access Infura
for ip in $INFURA_IPS; do
  sudo iptables -A FORWARD -i wlan1 -d $ip -j ACCEPT
done

# Redirect unauthenticated users to the captive portal
sudo iptables -t nat -A PREROUTING -i wlan1 -p tcp --dport 80 -j DNAT --to-destination 192.168.10.1:80

# Allow authenticated users internet access
sudo iptables -A FORWARD -i wlan1 -o eth0 -m state --state NEW -j ACCEPT
sudo iptables -A FORWARD -i eth0 -o wlan1 -m state --state RELATED,ESTABLISHED -j ACCEPT

# Masquerade
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

# Save the rules to be persistent after reboot
sudo sh -c "iptables-save > /etc/iptables.rules"
