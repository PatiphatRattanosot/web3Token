"use client";
import { useEffect, useState } from "react";
import { initializeConnector } from "@web3-react/core";
import { MetaMask } from "@web3-react/metamask";
import { ethers, parseUnits } from "ethers";
import { formatEther } from "@ethersproject/units";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  Stack,
  TextField,
  Container,
  Card,
  CardContent,
  Divider,
  Chip,
} from "@mui/material";
import abi from './fonts/api.json';

const [metaMask, hooks] = initializeConnector(
  (actions) => new MetaMask({ actions })
);
const { useAccounts, useIsActivating, useIsActive, useProvider } = hooks;

const Page: React.FC = () => {
  const contractChain = 11155111;
  const contractAddress = "0x1B6C07Cb03E1B618e2E85C9AFf77035eF4e69159";

  const accounts = useAccounts();
  const isActivating = useIsActivating();
  const isActive = useIsActive();
  const provider = useProvider();

  const [balance, setBalance] = useState<string>("0");
  const [myAccount, setMyAccount] = useState<string>("");
  const [buyToken, setBuyToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    void metaMask.connectEagerly().catch(() => {
      console.debug("Failed to connect eagerly to MetaMask");
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (!provider || !accounts || accounts.length === 0) return;

      const signer: any = provider?.getSigner();
      const smartContract = new ethers.Contract(contractAddress, abi, signer);
      const myBalance = await smartContract.balanceOf(accounts[0]);
      setMyAccount(accounts[0]);
      setBalance(formatEther(myBalance));
    })();
  }, [accounts, isActive, provider]);

  const handleConnect = () => {
    metaMask.activate(contractChain);
  };

  const handleDisconnect = () => {
    metaMask.resetState();
  };

  const handleBuyToken = async () => {
    if (parseFloat(buyToken) <= 0) {
      return;
    }

    try {
      setIsLoading(true);
      const signer: any = provider?.getSigner();
      const smartContract = new ethers.Contract(contractAddress, abi, signer);
      const valueConvertEther = parseUnits(buyToken.toString(), "ether");

      const tx = await smartContract.buy({ value: valueConvertEther });
      smartContract.on("Transfer", (from, to, tokens) => {
        const tokenFloat = parseFloat(formatEther(tokens));
        const balanceFloat = parseFloat(balance);
        const total = tokenFloat + balanceFloat;
        setBalance(total.toString());
        setBuyToken("");
      });
      console.log(tx.hash);
    } catch (error) {
      console.error("Error buying token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              News
            </Typography>
            {isActive ? (
              <Stack direction="row" spacing={2}>
                <Chip label={myAccount ? `${myAccount.slice(0, 6)}...${myAccount.slice(-4)}` : 'No account'} variant="outlined" />
                <Button color="inherit" onClick={handleDisconnect}>Disconnect</Button>
              </Stack>
            ) : (
              <Button color="inherit" onClick={handleConnect}>Connect</Button>
            )}
          </Toolbar>
        </AppBar>
      </Box>
      <Container maxWidth="sm" sx={{ mt: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h5">Contract Address: {contractAddress}</Typography>
            <Typography variant="h5">Balance: {balance} TPTP</Typography>
            {isActive && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography>Buy TPTP (1 ETH = 100 TPTP)</Typography>
                <TextField
                  label="ETH"
                  type="number"
                  value={buyToken}
                  onChange={(e) => setBuyToken(e.target.value)}
                />
                <Button variant="contained" onClick={handleBuyToken} disabled={isLoading}>
                  {isLoading ? "Buying..." : "Buy"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
};

export default Page;
