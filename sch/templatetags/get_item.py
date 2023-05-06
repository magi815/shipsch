from django import template
import pandas as pd

register = template.Library()

@register.filter(name='get_item')
def get_item(dictionary, key):
    value = dictionary.get(key)
    if isinstance(value, pd.Series):
        value = value.values[0]
    return str(value)

@register.filter(name='custom_format')
def custom_format(value, arg):
    return arg.format(value)
    

@register.filter(name='uniq')
def uniq_filter(seq):
    # seq에서 중복을 제거하고 유일한 항목들로 구성된 리스트를 반환합니다.
    unique_list = []
    for item in seq:
        if item not in unique_list:
            unique_list.append(item)
    return unique_list