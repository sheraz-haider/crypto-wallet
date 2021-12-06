import { useEffect, useState } from 'react';
import Web3 from 'web3';
import { networks, keyStoreKey } from './app.config';

const web3 = new Web3();

function Header({ currentNetwork, setCurrentNetwork }) {
  useEffect(() => {
    web3.setProvider(currentNetwork.rpc);
  }, [currentNetwork]);

  const selectNetwork = async (e, network) => {
    e.preventDefault();
    setCurrentNetwork(network);
  };

  return (
    <nav className='navbar navbar-expand-lg navbar-dark bg-dark'>
      <div className='container'>
        <a className='navbar-brand' href='/'>
          Crypto Wallet
        </a>
        <button
          className='navbar-toggler'
          type='button'
          data-bs-toggle='collapse'
          data-bs-target='#navbarNavDropdown'
          aria-controls='navbarNavDropdown'
          aria-expanded='false'
          aria-label='Toggle navigation'
        >
          <span className='navbar-toggler-icon'></span>
        </button>
        <div className='collapse navbar-collapse' id='navbarNavDropdown'>
          <div className='d-flex align-items-center ms-auto'>
            <span className='me-2 d-inline-block text-white'>
              {currentNetwork.name}
            </span>
            <ul className='navbar-nav'>
              <li className='nav-item dropdown'>
                <button
                  className='nav-link dropdown-toggle btn'
                  id='navbarDropdownMenuLink'
                  data-bs-toggle='dropdown'
                  aria-expanded='false'
                >
                  Select Network
                </button>
                <ul className='dropdown-menu'>
                  {networks.map(network => (
                    <li key={network.name}>
                      <a
                        className='dropdown-item'
                        href='#'
                        onClick={e => selectNetwork(e, network)}
                      >
                        {network.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

function MainScreen({ newWallet, setUiState }) {
  return (
    <div className='mt-5 container text-center'>
      {newWallet ? (
        <h2>Click the button below to create wallet</h2>
      ) : (
        <h2>Please login to access your wallet</h2>
      )}
      <button
        className='btn btn-primary mt-4'
        onClick={() => setUiState({ showPassword: true })}
      >
        {newWallet ? 'Create Wallet' : 'Login'}
      </button>
    </div>
  );
}

function PasswordScreen({
  newWallet,
  password,
  setPassword,
  setIsLoggedIn,
  setWallet,
}) {
  const createWallet = () => {
    const wallet = web3.eth.accounts.wallet.create(1);
    wallet.save(password, keyStoreKey);
    setWallet(wallet);
    setIsLoggedIn(true);
  };

  const login = () => {
    const wallet = web3.eth.accounts.wallet.load(password, keyStoreKey);
    setWallet(wallet);
    setIsLoggedIn(true);
  };

  const onSubmit = e => {
    e.preventDefault();
    if (newWallet) {
      return createWallet();
    }
    login();
  };

  return (
    <div className='mt-5 container text-center'>
      <p>Please {newWallet ? 'create' : 'enter'} a password</p>
      <form
        className='mx-auto'
        onSubmit={onSubmit}
        style={{ maxWidth: '400px' }}
      >
        <input
          type='password'
          name='password'
          id='password'
          className='form-control'
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type='submit' className='btn btn-primary mt-4'>
          Continue
        </button>
      </form>
    </div>
  );
}

function AccountDetailsScreen({ account, setCurrentAccount }) {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState(0);

  function sendTransaction() {
    account.signTransaction(
      {
        from: account.address,
        to: toAddress,
        value: web3.utils.toWei(amount),
        gas: 25000,
      },
      (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        const sentTx = web3.eth.sendSignedTransaction(
          data.raw || data.rawTransaction
        );
        sentTx.on('transactionHash', hash => {
          setToAddress('');
          setAmount('');
          alert(`Transaction Hash: ${hash}`);
        });
        sentTx.on('receipt', receipt => {
          console.log({ receipt });
        });
        sentTx.on('error', err => {
          alert('Transaction Failed!');
          console.error(err);
        });
      }
    );
  }

  return (
    <div className='text-center mx-auto container mt-5'>
      <button
        className='btn btn-secondary mb-3'
        onClick={() => setCurrentAccount(null)}
      >
        Go back
      </button>
      <h2 className='my-3'>Account Details</h2>
      <h3>Address</h3>
      <p>{account.address}</p>
      <h3>Balance</h3>
      <p>{account.balance}</p>
      <h2 className='my-3'>Send Eth</h2>
      <p>Enter Address to send</p>
      <input
        type='text'
        className='form-control mx-auto'
        style={{ maxWidth: '500px' }}
        placeholder='0x7DdC4C1EfCfCd269667be18D74a6Cd7aDe402409'
        value={toAddress}
        onChange={e => setToAddress(e.target.value)}
      />
      <div className='mt-3'>
        <span className='me-2'>Enter Amount</span>
        <input
          type='text'
          className='form-control mx-auto d-inline-block'
          style={{ maxWidth: '100px' }}
          placeholder='0.01'
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>
      <button className='btn btn-primary mt-4' onClick={sendTransaction}>
        Send
      </button>
    </div>
  );
}

function LoggedInScreen({ wallet, currentNetwork }) {
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);

  useEffect(() => {
    (async () => {
      setAccounts(await getAccounts());
    })();
  }, [currentNetwork]);

  async function getAccounts() {
    const accountsList = [];

    for (const key in wallet) {
      if (Object.hasOwnProperty.call(wallet, key)) {
        if (Number.isInteger(Number(key) && !web3.utils.isAddress(key))) {
          const element = wallet[key];
          const weiBalance = parseInt(
            await web3.eth.getBalance(element.address)
          );
          element.balance =
            weiBalance > 0 ? web3.utils.fromWei(weiBalance.toString()) : 0;
          accountsList.push(element);
        }
      }
    }

    return accountsList;
  }

  if (currentAccount) {
    return (
      <AccountDetailsScreen
        account={currentAccount}
        setCurrentAccount={setCurrentAccount}
      />
    );
  }

  return (
    <div className='mt-5 container text-center'>
      <h2>Accounts</h2>
      <table className='table mx-auto mt-5' style={{ maxWidth: '800px' }}>
        <thead>
          <tr>
            <th scope='col'>#</th>
            <th scope='col'>Account</th>
            <th scope='col'>Balance</th>
            <th scope='col'>Action</th>
          </tr>
        </thead>
        <tbody>
          {!!accounts.length &&
            accounts.map((account, index) => (
              <tr key={index}>
                <th scope='row'>{index + 1}</th>
                <td>{account.address}</td>
                <td>{account.balance}</td>
                <td>
                  <button
                    className='btn btn-primary'
                    onClick={() => setCurrentAccount(account)}
                  >
                    See Details
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [uiState, setUiStateFuc] = useState({ showPassword: false });

  const setUiState = newState => {
    setUiStateFuc(state => ({
      ...state,
      ...newState,
    }));
  };

  const [password, setPassword] = useState('');
  const [wallet, setWallet] = useState();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState(networks[0]);

  const foundWallet = !!localStorage.getItem(keyStoreKey);

  return (
    <div className='App'>
      <Header
        currentNetwork={currentNetwork}
        setCurrentNetwork={setCurrentNetwork}
      />
      {!isLoggedIn ? (
        <>
          {!uiState.showPassword ? (
            <MainScreen newWallet={!foundWallet} setUiState={setUiState} />
          ) : (
            <PasswordScreen
              newWallet={!foundWallet}
              password={password}
              setPassword={setPassword}
              setWallet={setWallet}
              setIsLoggedIn={setIsLoggedIn}
            />
          )}
        </>
      ) : (
        <LoggedInScreen wallet={wallet} currentNetwork={currentNetwork} />
      )}
    </div>
  );
}

export default App;
