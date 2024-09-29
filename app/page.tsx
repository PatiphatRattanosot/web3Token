"use client";

import React, { useState, useEffect } from 'react';
import { AppBar, Box, Button, Card, CardContent, Chip, Divider, IconButton, Stack, TextField, Toolbar, Typography, Container } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Signer, ethers } from 'ethers';
import { formatEther, parseUnits } from '@ethersproject/units';
import { initializeConnector } from '@web3-react/core';
import { MetaMask } from '@web3-react/metamask';
import abi from './fonts/api.json';

const [metaMask, hooks] = initializeConnector((actions) => new MetaMask({ actions }));
const { useChainId, useAccounts, useIsActive, useProvider } = hooks;


const contractChain = 11155111;
const contractAddress = "0x1B6C07Cb03E1B618e2E85C9AFf77035eF4e69159"; // Address of the smart contract

const getAddressTxt = (str: string | any[], s = 6, e = 6) => {
  if (typeof str === 'string' && str.length > s + e) {
    return `${str.slice(0, s)}...${str.slice(-e)}`;
  }
  return str;
};

export default function Page() {
  const chainId = useChainId();
  const accounts = useAccounts();
  const isActive = useIsActive();
  const provider = useProvider();
  const [balance, setBalance] = useState<string>('');
  const [ETHValue, setETHValue] = useState<number>(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const [swap, setSwap] = useState(false)
  useEffect(() => {
    const fetchBalance = async () => {
      if (!provider || !accounts?.[0]) {
        return;
      }

      try {
        const signer:any = provider.getSigner() ;
        const smartContract = new ethers.Contract(contractAddress, abi, signer);
        const myBalance = await smartContract.balanceOf(accounts[0]);

        setBalance(formatEther(myBalance));
      } catch (err) {
        console.error('Error fetching balance:', err);
        setError('Error fetching balance');
      }
    };

    if (isActive) {
      fetchBalance();
    }
  }, [isActive]);

  const handleBuy = async () => {
    if (ETHValue <= 0) {
      return;
    }


    const signer:any = provider?.getSigner() ;
    const smartContract = new ethers.Contract(contractAddress, abi, signer);
    const weiValue = parseUnits(ETHValue.toString(), "ether");
    const tx = await smartContract.buy({
      value: weiValue.toString(),
    });
    setSwap(!swap)
    console.log("Transaction hash:", tx.hash);
  };



  useEffect(() => {
    void metaMask.connectEagerly().catch(() => {
      console.debug("Failed to connect eagerly to MetaMask");
    });
  }, []);

  const handleConnect = () => {
    metaMask.activate(contractChain);
  };

  const handleDisconnect = () => {
    metaMask.resetState();
    alert(
      "To fully disconnect, please remove this site from MetaMask's connected sites by locking MetaMask."
    );
  };


  return (
    <div>
      <div className="Navbar">
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                News
              </Typography>
              {isActive ? (
                <Stack direction="row" spacing={2}>
                  <Chip className='text-white' label={accounts?.[0] ? getAddressTxt(accounts[0]) : 'No account'} variant="outlined" />
                  <Button className='text-white' onClick={handleDisconnect}>Disconnect</Button>
                </Stack>
              ) : (
                <Button className='text-white' onClick={handleConnect}>Connect</Button>
              )}
            </Toolbar>
          </AppBar>
        </Box>
      </div>
      <Card sx={{ minWidth: 275, mt: 2 }}>
        <CardContent>
          <Typography variant="h5" component="div">
            <span>ChainId: </span>{chainId}
          </Typography>
          <Typography variant="h5" component="div">
            <span>IsActive: </span>{isActive.toString()}
          </Typography>
          <Typography variant="h5" component="div">
            <span>Accounts: </span>{accounts ? getAddressTxt(accounts[0]) : ''}
          </Typography>
        </CardContent>
      </Card>
      <Container maxWidth="sm" sx={{ mt: 2 }}>
        {isActive ? (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography>TPTP</Typography>
                <TextField label="Contract Address" value={contractAddress} />
                <TextField label="TPTP Balance" value={balance} />
                <Divider />
                <Typography>Buy TPTP (1 ETH = 100 TPTP)</Typography>
                <TextField
                  label="ETH"
                  type="number"
                  value={ETHValue}
                  onChange={e => setETHValue(Number(e.target.value))}
                />
                <Button variant="contained" onClick={handleBuy}>
                  Buy
                </Button>
                {error && <Typography color="error">{error}</Typography>}
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Container>
    </div>
  );
}
