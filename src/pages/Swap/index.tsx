import React, { useContext, useState, useEffect } from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonLight, ButtonPrimary } from '../../components-ewt/Button'
import Card, { GreyCard } from '../../components-ewt/Card'
import { AutoColumn } from '../../components-ewt/Column'
import ConfirmationModal from '../../components-ewt/ConfirmationModal'
import CurrencyInputPanel from '../../components-ewt/CurrencyInputPanel'
import { RowBetween } from '../../components-ewt/Row'
import { ArrowWrapper, BottomGrouping, Wrapper } from '../../components-ewt/swap/styleds'
import SwapModalHeader from '../../components-ewt/swap/SwapModalHeader'
import { TokenWarningCards } from '../../components-ewt/TokenWarningCard'
import { useActiveWeb3React } from '../../hooks'
import { useWalletModalToggle } from '../../state/application/hooks'

import { Field } from '../../state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapState
} from '../../state/swap/hooks'
import { CursorPointer, TYPE } from '../../theme'
import { getIDOContract } from '../../utils'
import AppBody from '../AppBody'
import { parseUnits } from '@ethersproject/units'
import ProgressBar from "@ramonak/react-progress-bar";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Swap() {
  useDefaultsFromURLSearch()

  const ratio = 2.4;
  const { chainId, account, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const contract = getIDOContract(chainId, library, account);
  const [harvestAmount, setHarvestAmount] = useState(0);
  const [totalSupplyText, setTotalSupplyText] = useState("0/0");
  const [supplyProgress, setSupplyProgress] = useState("0");
  const [countdown, setCountDown] = useState({ day: 0, hour: 0, minute: 0, second: 0 })
  const [balanceError, setBalanceError] = useState(false);
  const [isSwapAble, setIsSwapAble] = useState(true);

  var interval = null;

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // swap state
  const { independentField } = useSwapState()
  const { tokenBalances, tokens } = useDerivedSwapInfo()

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false) // show confirmation modal

  const [tokenValue, setTokenValue] = useState({
    INPUT: '',
    OUTPUT: ''
  })

  const onChangeInput = (filed, typedValue) => {
    if (filed == Field.INPUT) {
      setTokenValue({ ...tokenValue, [Field.INPUT]: formatValue(typedValue), [Field.OUTPUT]: formatValue((typedValue / ratio).toFixed(6)) });
    } else {
      setTokenValue({ ...tokenValue, [Field.INPUT]: formatValue((typedValue * ratio).toFixed(6)), [Field.OUTPUT]: formatValue(typedValue) });
    }
  }

  const formatValue = (value) => {
    return value == "0.000000" ? "" : value
  }

  useEffect(() => {
    if (account) {
      loadHarvestAmount();
      loadTotalHarvestAmount();
      isSwapAbleLoad();
    }
  }, [account])

  useEffect(() => {
    var interval1 = setInterval(() => {
      if (account) {
        loadHarvestAmount();
        loadTotalHarvestAmount();
        isSwapAbleLoad();
      }
    }, 3000)

    return () => {
      if (!interval1 === null) clearInterval(interval1)
    };
  }, [])

  const successToast = (text) => toast.success(text, {
    position: "bottom-left",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });

  const errorToast = (text) => toast.error(text, {
    position: "bottom-left",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });

  useEffect(() => {
    if (!interval === null) clearInterval(interval)

    if (account) {
      (async () => {
        try {
          const deadline = 1637388546 - Math.floor((new Date()).getTime() / 1000);
          var i = 0;
          interval = setInterval(() => {
            let d = getTimeFormat(deadline - i);
            setCountDown(d);
            i++;
          }, 1000)
        } catch (e) {
          console.error(e)
        }
      })();
    }

    return () => {
      if (!interval === null) clearInterval(interval)
    };
  }, [account])

  const isSwapAbleLoad = async () => {
    try {
      const isSwap = await contract.isSwapAble();
      setIsSwapAble(isSwap);
    } catch (error) {
      console.error(error);
    }
  }

  const loadHarvestAmount = async () => {
    try {
      const amount = await contract.depositedBalance(account)
      setHarvestAmount(parseInt(amount) / (10 ** 18));
    } catch (error) {
      console.error(error);
    }
  }

  const loadTotalHarvestAmount = async () => {
    try {
      const max = await contract.maxTotalDepositedSupply()
      const current = await contract.depositedSupply();
      const text = `${(parseInt(current) / (10 ** 18))}/${(parseInt(max) / (10 ** 18))}`
      const percent = (parseInt(current) / parseInt(max) * 100).toFixed(2);
      setSupplyProgress(percent)
      setTotalSupplyText(text);
    } catch (error) {
      console.error(error);
    }
  }

  const getTimeFormat = (time: number) => {
    if (time > 0) {
      let temp = time;
      const day = parseInt((temp / (3600 * 24)).toString());
      temp = temp - day * 3600 * 24;
      const hour = parseInt((temp / 3600).toString());
      temp = temp - hour * 3600;
      const minute = parseInt((temp / 60).toString());
      const second = parseInt((temp - minute * 60).toString());

      return { day: day, hour: hour, minute: minute, second: second };
    }
    return { day: 0, hour: 0, minute: 0, second: 0 };
  }

  const onConfirm = async () => {
    try {
      await contract.swap({ value: parseUnits(tokenValue.INPUT) });
      loadHarvestAmount();
      loadTotalHarvestAmount();
      setShowConfirm(false);
    } catch (error) {
      errorToast(error.message);
    }
  }

  function modalHeader() {
    return (
      <SwapModalHeader
        tokens={tokens}
        formattedAmounts={tokenValue}
        independentField={independentField}
        onConfirm={onConfirm}
      />
    )
  }

  return (
    <>
      <TokenWarningCards tokens={tokens} />
      <AppBody>
        <Wrapper id="swap-page">
          <ConfirmationModal
            isOpen={showConfirm}
            title="Confirm Deposit"
            onDismiss={() => {
              setShowConfirm(false)
            }}
            topContent={modalHeader}
            hash=''
          />

          <AutoColumn gap={'md'}>
            <>
              <CurrencyInputPanel
                field={Field.INPUT}
                label={independentField === Field.OUTPUT ? 'From (estimated)' : 'From'}
                value={tokenValue[Field.INPUT]}
                showMaxButton={false}
                token={tokens[Field.INPUT]}
                onUserInput={onChangeInput}
                otherSelectedTokenAddress={tokens[Field.OUTPUT]?.address}
                id="swap-currency-input"
              />
              <CursorPointer>
                <AutoColumn style={{ padding: '0 1rem' }}>
                  <ArrowWrapper>
                    <ArrowDown
                      size="16"
                      color={tokens[Field.INPUT] && tokens[Field.OUTPUT] ? theme.primary1 : theme.text2}
                    />
                  </ArrowWrapper>
                </AutoColumn>
              </CursorPointer>
              <CurrencyInputPanel
                field={Field.OUTPUT}
                value={tokenValue[Field.OUTPUT]}
                onUserInput={onChangeInput}
                label={independentField === Field.INPUT ? 'To (estimated)' : 'To'}
                showMaxButton={false}
                token={tokens[Field.OUTPUT]}
                otherSelectedTokenAddress={tokens[Field.INPUT]?.address}
                id="swap-currency-output"
              />
            </>

            <Card padding={'.25rem .75rem 0 .75rem'} borderRadius={'20px'}>
              <AutoColumn gap="4px">
                <RowBetween align="center">
                  <Text fontWeight={500} fontSize={14} color={theme.text2}>
                    Price
                  </Text>
                  <Text fontWeight={500} fontSize={14} color={theme.text2}>
                    {ratio} CELO = 1 CCB
                  </Text>
                </RowBetween>
              </AutoColumn>
            </Card>
          </AutoColumn>
          <BottomGrouping>
            {account && <GreyCard style={{ textAlign: 'center' }}>
              <TYPE.main mt="4px" style={{ fontSize: ".875rem" }}>{`CELO DEPOSITED ${totalSupplyText} IDO MAX`}</TYPE.main>
            </GreyCard>}
            {account && <GreyCard style={{ textAlign: 'center' }}>
              <ProgressBar
                completed={supplyProgress}
                labelAlignment="left"
                labelColor="#212529"
              />
            </GreyCard>}
            {account && <GreyCard style={{ textAlign: 'center' }}>
              <TYPE.main mt="4px" style={{ fontSize: ".875rem" }}>{`${countdown.day} day ${countdown.hour} hour ${countdown.minute} min ${countdown.second} sec`}</TYPE.main>
            </GreyCard>}
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : balanceError ? <GreyCard style={{ textAlign: 'center' }}>
              <TYPE.main mb="4px">Insufficient ETH balance</TYPE.main>
            </GreyCard> : parseFloat(tokenValue.OUTPUT) > 0 ?
              <ButtonPrimary
                disabled={!isSwapAble}
                onClick={() => onConfirm()}
              >
                {`Deposit`}
              </ButtonPrimary> : <GreyCard style={{ textAlign: 'center' }}>
                <TYPE.main mb="4px">Please enter a deposit amount.</TYPE.main>
              </GreyCard>
            }
            <br />
            {account && <ButtonPrimary
              disabled={isSwapAble}
            >
              {`Harvest ${(harvestAmount / ratio).toFixed(2)} CCB`}
            </ButtonPrimary>}
          </BottomGrouping>
        </Wrapper>
      </AppBody>
      <ToastContainer
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  )
}
