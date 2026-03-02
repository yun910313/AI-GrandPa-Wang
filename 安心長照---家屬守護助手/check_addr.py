TARGET = r'C:\Users\yun\Desktop\GrandPa Wang\AI-GrandPa-Wang\安心長照---家屬守護助手\src\App.tsx'

with open(TARGET, encoding='utf-8') as f:
    c = f.read()

# Find the area around the address field 
idx = c.find('\u96fb\u5b50\u570d\u7c69\u5b89\u5168\u5730\u5740')
print(f"Found at: {idx}")
print(repr(c[idx-100:idx+400]))
