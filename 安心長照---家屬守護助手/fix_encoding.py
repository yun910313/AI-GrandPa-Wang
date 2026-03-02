"""
Full scan and fix of App.tsx corruption.
The file has mixed encoding due to PowerShell Set-Content.
Strategy: Find all non-UTF-8 sequences and try to fix them.
"""

with open('src/App.tsx', 'rb') as f:
    raw = f.read()

print(f"File size: {len(raw)} bytes")

# Find all positions that break UTF-8 decoding
issues = []
i = 0
while i < len(raw):
    b = raw[i]
    if b < 0x80:
        i += 1
    elif b >= 0xC0 and b < 0xE0:
        # 2-byte sequence
        if i + 1 >= len(raw) or (raw[i+1] & 0xC0) != 0x80:
            issues.append((i, 2, raw[i:i+2]))
            i += 1
        else:
            i += 2
    elif b >= 0xE0 and b < 0xF0:
        # 3-byte sequence
        if i + 2 >= len(raw) or (raw[i+1] & 0xC0) != 0x80 or (raw[i+2] & 0xC0) != 0x80:
            issues.append((i, 3, raw[i:i+3]))
            i += 1
        else:
            i += 3
    elif b >= 0xF0:
        # 4-byte sequence
        if i + 3 >= len(raw) or (raw[i+1] & 0xC0) != 0x80 or (raw[i+2] & 0xC0) != 0x80 or (raw[i+3] & 0xC0) != 0x80:
            issues.append((i, 4, raw[i:i+4]))
            i += 1
        else:
            i += 4
    else:
        issues.append((i, 1, raw[i:i+1]))
        i += 1

print(f"Found {len(issues)} encoding issues")
for pos, size, data in issues[:20]:
    ctx_start = max(0, pos - 40)
    ctx_end = min(len(raw), pos + 40)
    ctx = raw[ctx_start:ctx_end]
    safe_ctx = ctx.replace(b'\\', b'\\\\')
    print(f"  pos={pos}: bytes={data.hex()}, context ascii: {repr(ctx)}")
