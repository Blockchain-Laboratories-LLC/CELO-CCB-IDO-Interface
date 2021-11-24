import { Token, TokenAmount } from '@uniswap/sdk'
import React, { useContext } from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { Field } from '../../state/swap/actions'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import TokenLogo from '../TokenLogo'
import { TruncatedText } from './styleds'
import { ButtonSecondary } from '../Button'

export default function SwapModalHeader({
  tokens,
  formattedAmounts,
  independentField,
  onConfirm
}: {
  tokens: { [field in Field]?: Token }
  formattedAmounts: { [field in Field]?: string }
  independentField: Field,
  onConfirm: Function
}) {
  const theme = useContext(ThemeContext)

  return (
    <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
      <RowBetween align="flex-end">
        <TruncatedText fontSize={24} fontWeight={500}>
          {formattedAmounts[Field.INPUT]}
        </TruncatedText>
        <RowFixed gap="4px">
          <TokenLogo address={tokens[Field.INPUT]?.address} size={'24px'} />
          <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
            {tokens[Field.INPUT]?.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
      <RowFixed>
        <ArrowDown size="16" color={theme.text2} />
      </RowFixed>
      <ButtonSecondary onClick={() => onConfirm()}>
        Confrim Deposit
      </ButtonSecondary>
    </AutoColumn>
  )
}
