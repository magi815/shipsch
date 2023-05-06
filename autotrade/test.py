import pyupbit
import pandas as pd
import time
from datetime import datetime
import time, calendar
import requests
from decimal import *
import numpy as np

access = "iXtGEKQhAn9PMfiLy0cW5F8QpbhxVeZ3bUrN65YT"          # 본인 값으로 변경
secret = "53zNkIs4dCxlic3AXygLNnIAxEmEvJ0fvuc5XWFN"          # 본인 값으로 변경
upbit = pyupbit.Upbit(access, secret)

indexName = pyupbit.get_tickers(fiat="KRW")

tickers = pyupbit.get_tickers(fiat="KRW")
def get_current_price(ticker):
    """현재가 조회"""
    return pyupbit.get_orderbook(ticker=ticker)["orderbook_units"][0]["ask_price"]


def get_rsi_ema(ticker, interval="day", count=15):
    """RSI 계산 (EMA 사용)"""
    df = pyupbit.get_ohlcv(ticker, interval=interval, count=count*2)
    delta = df['close'].diff().dropna()

    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)

    avg_gain = gain.ewm(com=count-1, min_periods=count).mean()
    avg_loss = loss.ewm(com=count-1, min_periods=count).mean()

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))

    return rsi.iloc[-1]


def check():
    for i in indexName:
        rsi = get_rsi_ema(i)
        print(f"{i}: {get_current_price(i)}, RSI: {rsi}")
        time.sleep(0.2)  # 각 요청 사이에 0.5초 대기

check()