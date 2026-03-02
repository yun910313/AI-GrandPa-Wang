"""
Inject geocoding (address -> lat/lng) into EditElderlyView in App.tsx.
Uses Nominatim OpenStreetMap API (free, no key needed).
"""

TARGET = r'C:\Users\yun\Desktop\GrandPa Wang\AI-GrandPa-Wang\安心長照---家屬守護助手\src\App.tsx'

with open(TARGET, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File size: {len(content)} chars")

# ---------------------------------------------------------------
# 1. Add geocodeStatus state inside EditElderlyView
# ---------------------------------------------------------------
old_1 = "  const [submitting, setSubmitting] = useState(false);\n  const [formData, setFormData] = useState<Partial<ElderlyProfile>>({"
new_1 = """  const [submitting, setSubmitting] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState<Partial<ElderlyProfile>>({"""
content = content.replace(old_1, new_1, 1)
print(f"1. geocodeStatus: {'geocodeStatus' in content}")

# ---------------------------------------------------------------
# 2. Add geocodeAddress() function before fetchProfiles
# ---------------------------------------------------------------
old_2 = "  const fetchProfiles = async () => {"
new_2 = """  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    setGeocodeStatus('loading');
    try {
      const encoded = encodeURIComponent(address);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&accept-language=zh-TW`,
        { headers: { 'User-Agent': 'AnXinLTC-App/1.0' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData(prev => ({
          ...prev,
          safe_zone_lat: parseFloat(parseFloat(lat).toFixed(7)),
          safe_zone_lng: parseFloat(parseFloat(lon).toFixed(7)),
        }));
        setGeocodeStatus('success');
      } else {
        setGeocodeStatus('error');
      }
    } catch (err) {
      console.error('Geocode error:', err);
      setGeocodeStatus('error');
    }
  };

  const fetchProfiles = async () => {"""
content = content.replace(old_2, new_2, 1)
print(f"2. geocodeAddress fn: {'nominatim.openstreetmap.org' in content}")

# ---------------------------------------------------------------
# 3. Replace safe_zone_address input
# ---------------------------------------------------------------
old_3 = (
    '          <div className="space-y-1">\n'
    '            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">\u96fb\u5b50\u570d\u7c69\u5b89\u5168\u5730\u5740</label>\n'
    '            <input\n'
    '              type="text"\n'
    '              value={formData.safe_zone_address || \'\'}\n'
    '              onChange={e => setFormData({ ...formData, safe_zone_address: e.target.value })}\n'
    '              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"\n'
    '            />\n'
    '          </div>'
)
new_3 = (
    '          <div className="space-y-1">\n'
    '            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">\u96fb\u5b50\u570d\u7c69\u5b89\u5168\u5730\u5740</label>\n'
    '            <div className="flex gap-2">\n'
    '              <input\n'
    '                type="text"\n'
    '                placeholder="\u8f38\u5165\u5730\u5740\uff0c\u6309 Enter \u6216\u9ede\u300c\u67e5\u8a62\u5ea7\u6a19\u300d\u81ea\u52d5\u5224\u5b9a"\n'
    '                value={formData.safe_zone_address || \'\'}\n'
    '                onChange={e => {\n'
    '                  setFormData({ ...formData, safe_zone_address: e.target.value });\n'
    '                  setGeocodeStatus(\'idle\');\n'
    '                }}\n'
    '                onKeyDown={e => {\n'
    '                  if (e.key === \'Enter\') {\n'
    '                    e.preventDefault();\n'
    '                    geocodeAddress(formData.safe_zone_address || \'\');\n'
    '                  }\n'
    '                }}\n'
    '                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"\n'
    '              />\n'
    '              <button\n'
    '                type="button"\n'
    '                onClick={() => geocodeAddress(formData.safe_zone_address || \'\')}\n'
    '                disabled={geocodeStatus === \'loading\' || !formData.safe_zone_address?.trim()}\n'
    '                className="px-4 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-all flex-shrink-0 whitespace-nowrap"\n'
    '              >\n'
    '                {geocodeStatus === \'loading\' ? \'\u67e5\u8a62\u4e2d...\' : \'\u67e5\u8a62\u5750\u6a19\'}\n'
    '              </button>\n'
    '            </div>\n'
    '            {geocodeStatus === \'success\' && (\n'
    '              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">\n'
    '                <span>\u2714\ufe0f</span> \u5ea7\u6a19\u5df2\u81ea\u52d5\u5224\u5b9a\uff01\u53ef\u5728\u4e0b\u65b9\u6aa2\u8996\u6216\u624b\u52d5\u8abf\u6574\n'
    '              </p>\n'
    '            )}\n'
    '            {geocodeStatus === \'error\' && (\n'
    '              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">\n'
    '                <span>\u26a0\ufe0f</span> \u67e5\u8a62\u4e0d\u5230\u5c0d\u61c9\u5750\u6a19\uff0c\u8acb\u8a66\u8457\u8f38\u5165\u5b8c\u6574\u5730\u5740\uff0c\u6216\u624b\u52d5\u8f38\u5165\u5750\u6a19\n'
    '              </p>\n'
    '            )}\n'
    '          </div>'
)
if old_3 in content:
    content = content.replace(old_3, new_3, 1)
    print(f"3. Address input replaced: OK")
else:
    print(f"3. ERROR: address section not found!")

# ---------------------------------------------------------------
# 4. Replace lat/lng inputs
# ---------------------------------------------------------------
old_4 = (
    '          <div className="grid grid-cols-2 gap-4">\n'
    '            <div className="space-y-1">\n'
    '              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">\u4e2d\u5fc3\u7def\u5ea6 (Latitude)</label>\n'
    '              <input\n'
    '                type="number" step="any"\n'
    '                placeholder="\u4f8b\u5982: 22.6273"\n'
    '                value={formData.safe_zone_lat ?? \'\'}\n'
    '                onChange={e => setFormData({ ...formData, safe_zone_lat: e.target.value === \'\' ? undefined : Number(e.target.value) })}\n'
    '                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"\n'
    '              />\n'
    '            </div>\n'
    '            <div className="space-y-1">\n'
    '              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">\u4e2d\u5fc3\u7d93\u5ea6 (Longitude)</label>\n'
    '              <input\n'
    '                type="number" step="any"\n'
    '                placeholder="\u4f8b\u5982: 120.3014"\n'
    '                value={formData.safe_zone_lng ?? \'\'}\n'
    '                onChange={e => setFormData({ ...formData, safe_zone_lng: e.target.value === \'\' ? undefined : Number(e.target.value) })}\n'
    '                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"\n'
    '              />\n'
    '            </div>\n'
    '          </div>'
)
new_4 = (
    '          <div className="grid grid-cols-2 gap-4">\n'
    '            <div className="space-y-1">\n'
    '              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">\n'
    '                \u7def\u5ea6 (Lat)\n'
    '                <span className="ml-1 text-indigo-400 normal-case font-normal tracking-normal">\u81ea\u52d5/\u53ef\u624b\u52d5</span>\n'
    '              </label>\n'
    '              <input\n'
    '                type="number" step="any"\n'
    '                placeholder="\u5730\u5740\u67e5\u8a62\u5f8c\u81ea\u52d5\u586b\u5165"\n'
    '                value={formData.safe_zone_lat ?? \'\'}\n'
    '                onChange={e => {\n'
    '                  setGeocodeStatus(\'idle\');\n'
    '                  setFormData({ ...formData, safe_zone_lat: e.target.value === \'\' ? undefined : Number(e.target.value) });\n'
    '                }}\n'
    '                className={cn(\n'
    '                  "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors",\n'
    '                  geocodeStatus === \'success\' ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-200"\n'
    '                )}\n'
    '              />\n'
    '            </div>\n'
    '            <div className="space-y-1">\n'
    '              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">\n'
    '                \u7d93\u5ea6 (Lng)\n'
    '                <span className="ml-1 text-indigo-400 normal-case font-normal tracking-normal">\u81ea\u52d5/\u53ef\u624b\u52d5</span>\n'
    '              </label>\n'
    '              <input\n'
    '                type="number" step="any"\n'
    '                placeholder="\u5730\u5740\u67e5\u8a62\u5f8c\u81ea\u52d5\u586b\u5165"\n'
    '                value={formData.safe_zone_lng ?? \'\'}\n'
    '                onChange={e => {\n'
    '                  setGeocodeStatus(\'idle\');\n'
    '                  setFormData({ ...formData, safe_zone_lng: e.target.value === \'\' ? undefined : Number(e.target.value) });\n'
    '                }}\n'
    '                className={cn(\n'
    '                  "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors",\n'
    '                  geocodeStatus === \'success\' ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-200"\n'
    '                )}\n'
    '              />\n'
    '            </div>\n'
    '          </div>\n'
    '          {!!(formData.safe_zone_lat && formData.safe_zone_lng) && (\n'
    '            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">\n'
    '              <MapPin size={14} className="text-indigo-500 flex-shrink-0" />\n'
    '              <p className="text-xs text-indigo-700 font-medium">\n'
    '                \u5ea7\u6a19\uff1a {Number(formData.safe_zone_lat).toFixed(5)}, {Number(formData.safe_zone_lng).toFixed(5)}\n'
    '              </p>\n'
    '            </div>\n'
    '          )}'
)
if old_4 in content:
    content = content.replace(old_4, new_4, 1)
    print(f"4. Lat/lng inputs replaced: OK")
else:
    print(f"4. ERROR: lat/lng section not found!")
    # Try searching for key parts
    search1 = '中心緯度 (Latitude)'
    search2 = '中心經度 (Longitude)'
    print(f"   '{search1}' found: {search1 in content}")
    print(f"   '{search2}' found: {search2 in content}")

# Write back
with open(TARGET, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content)

# Verify
with open(TARGET, 'r', encoding='utf-8') as f:
    verify = f.read()
print(f"\nFinal verification:")
print(f"  File size: {len(verify)} chars")
print(f"  geocodeAddress: {'const geocodeAddress = async' in verify}")
print(f"  Nominatim API: {'nominatim.openstreetmap.org' in verify}")
print(f"  查詢座標 button: {'查詢座標' in verify}")
print(f"  Success msg: {'座標已自動判定' in verify}")
