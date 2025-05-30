import React, { type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { AlignedText } from '@actual-app/components/aligned-text';
import { theme } from '@actual-app/components/theme';
import { css } from '@emotion/css';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';

import {
  amountToCurrency,
  amountToCurrencyNoDecimal,
} from 'loot-core/shared/util';
import {
  type balanceTypeOpType,
  type DataEntity,
} from 'loot-core/types/models';

import { usePrivacyMode } from '../../../hooks/usePrivacyMode';
import { Container } from '../Container';

import { adjustTextSize } from './adjustTextSize';
import { renderCustomLabel } from './renderCustomLabel';

type PayloadItem = {
  payload: {
    date: string;
    totalAssets: number;
    totalDebts: number;
    netAssets: number;
    netDebts: number;
    totalTotals: number;
  };
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: PayloadItem[];
  balanceTypeOp: balanceTypeOpType;
};

const CustomTooltip = ({
  active,
  payload,
  balanceTypeOp,
}: CustomTooltipProps) => {
  const { t } = useTranslation();

  if (active && payload && payload.length) {
    return (
      <div
        className={css({
          zIndex: 1000,
          pointerEvents: 'none',
          borderRadius: 2,
          boxShadow: '0 1px 6px rgba(0, 0, 0, .20)',
          backgroundColor: theme.menuBackground,
          color: theme.menuItemText,
          padding: 10,
        })}
      >
        <div>
          <div style={{ marginBottom: 10 }}>
            <strong>{payload[0].payload.date}</strong>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            {['totalAssets', 'totalTotals'].includes(balanceTypeOp) && (
              <AlignedText
                left={t('Assets:')}
                right={amountToCurrency(payload[0].payload.totalAssets)}
              />
            )}
            {['totalDebts', 'totalTotals'].includes(balanceTypeOp) && (
              <AlignedText
                left={t('Debts:')}
                right={amountToCurrency(payload[0].payload.totalDebts)}
              />
            )}
            {['netAssets'].includes(balanceTypeOp) && (
              <AlignedText
                left={t('Net Assets:')}
                right={amountToCurrency(payload[0].payload.netAssets)}
              />
            )}
            {['netDebts'].includes(balanceTypeOp) && (
              <AlignedText
                left={t('Net Debts:')}
                right={amountToCurrency(payload[0].payload.netDebts)}
              />
            )}
            {['totalTotals'].includes(balanceTypeOp) && (
              <AlignedText
                left={t('Net:')}
                right={
                  <strong>
                    {amountToCurrency(payload[0].payload.totalTotals)}
                  </strong>
                }
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div />;
};

type PropsItem = {
  index?: number;
  x?: string | number;
  y?: string | number;
  value?: string | number;
  width?: string | number;
};

const customLabel = ({
  props,
  width,
  end,
}: {
  props: PropsItem;
  width: number;
  end: number;
}) => {
  //Add margin to first and last object
  const calcX =
    (typeof props.x === 'number' ? props.x : 0) +
    (props.index === end ? -10 : props.index === 0 ? 5 : 0);
  const calcY =
    (typeof props.y === 'number' ? props.y : 0) -
    ((typeof props.value === 'number' ? props.value : 0) > 0 ? 10 : -10);
  const textAnchor = props.index === 0 ? 'left' : 'middle';
  const display =
    typeof props.value !== 'string' && props.value !== 0
      ? `${amountToCurrencyNoDecimal(props.value || 0)}`
      : '';
  const textSize = adjustTextSize({ sized: width, type: 'area' });

  return renderCustomLabel(calcX, calcY, textAnchor, display, textSize);
};

type AreaGraphProps = {
  style?: CSSProperties;
  data: DataEntity;
  balanceTypeOp: balanceTypeOpType;
  compact?: boolean;
  viewLabels: boolean;
  showTooltip?: boolean;
};

export function AreaGraph({
  style,
  data,
  balanceTypeOp,
  compact,
  viewLabels,
  showTooltip = true,
}: AreaGraphProps) {
  const privacyMode = usePrivacyMode();
  const dataMax = Math.max(...data.intervalData.map(i => i[balanceTypeOp]));
  const dataMin = Math.min(...data.intervalData.map(i => i[balanceTypeOp]));

  const labelsMargin = viewLabels ? 30 : 0;
  const dataDiff = dataMax - dataMin;
  const absDataMax = Math.max(Math.abs(dataMax), Math.abs(dataMin));
  //Calculate how much to add to max and min values for graph range
  const extendRangeAmount = Math.floor(dataDiff / 20);
  const labelsMin =
    //If min is zero or graph range passes zero then set it to zero
    dataMin === 0 || Math.abs(dataMin) <= extendRangeAmount
      ? 0
      : //Else add the range and round to nearest 100s
        Math.floor((dataMin - extendRangeAmount) / 100) * 100;
  //Same as above but for max
  const labelsMax =
    dataMax === 0 || Math.abs(dataMax) <= extendRangeAmount
      ? 0
      : Math.ceil((dataMax + extendRangeAmount) / 100) * 100;
  const lastLabel = data.intervalData.length - 1;

  const tickFormatter = (tick: number) => {
    if (!privacyMode) return `${amountToCurrencyNoDecimal(tick)}`; // Formats the tick values as strings with commas
    return '...';
  };

  const gradientOffset = () => {
    if (dataMax <= 0) {
      return 0;
    }
    if (dataMin >= 0) {
      return 1;
    }

    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

  const leftMargin = Math.abs(absDataMax) > 1000000 ? 20 : 0;
  return (
    <Container
      style={{
        ...style,
        ...(compact && { height: 'auto' }),
      }}
    >
      {(width, height) =>
        data.intervalData && (
          <ResponsiveContainer>
            <div>
              {!compact && <div style={{ marginTop: '15px' }} />}
              <AreaChart
                width={width}
                height={height}
                data={data.intervalData}
                margin={{
                  top: 0,
                  right: labelsMargin,
                  left: leftMargin,
                  bottom: 10,
                }}
              >
                {compact ? null : (
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                )}
                {compact ? null : (
                  <XAxis
                    dataKey="date"
                    tick={{ fill: theme.pageText }}
                    tickLine={{ stroke: theme.pageText }}
                  />
                )}
                {compact ? null : (
                  <YAxis
                    dataKey={balanceTypeOp}
                    domain={[
                      viewLabels ? labelsMin : 'auto',
                      viewLabels ? labelsMax : 'auto',
                    ]}
                    tickFormatter={tickFormatter}
                    tick={{ fill: theme.pageText }}
                    tickLine={{ stroke: theme.pageText }}
                    tickSize={0}
                  />
                )}
                {showTooltip && (
                  <Tooltip
                    content={<CustomTooltip balanceTypeOp={balanceTypeOp} />}
                    isAnimationActive={false}
                  />
                )}
                <defs>
                  <linearGradient
                    id={`fill${balanceTypeOp}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset={off}
                      stopColor={theme.reportsBlue}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset={off}
                      stopColor={theme.reportsRed}
                      stopOpacity={0.2}
                    />
                  </linearGradient>
                  <linearGradient
                    id={`stroke${balanceTypeOp}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset={off}
                      stopColor={theme.reportsBlue}
                      stopOpacity={1}
                    />
                    <stop
                      offset={off}
                      stopColor={theme.reportsRed}
                      stopOpacity={1}
                    />
                  </linearGradient>
                </defs>

                <Area
                  type="linear"
                  dot={false}
                  activeDot={false}
                  animationDuration={0}
                  dataKey={balanceTypeOp}
                  stroke={`url(#stroke${balanceTypeOp})`}
                  fill={`url(#fill${balanceTypeOp})`}
                  fillOpacity={1}
                >
                  {viewLabels && !compact && (
                    <LabelList
                      dataKey={balanceTypeOp}
                      content={props =>
                        customLabel({ props, width, end: lastLabel })
                      }
                    />
                  )}
                </Area>
              </AreaChart>
            </div>
          </ResponsiveContainer>
        )
      }
    </Container>
  );
}
