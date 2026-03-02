"""
Add FontSize feature back to App.tsx using proper UTF-8 Python approach.
"""
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
target_path = os.path.join(script_dir, '\u5b89\u5fc3\u9577\u7167---\u5bb6\u5c6c\u5b88\u8b77\u52a9\u624b', 'src', 'App.tsx')

with open(target_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File size: {len(content)} chars")
print(f"Has FontSizeContext already: {'FontSizeContext' in content}")

# 1. Update import: add createContext, useContext, useCallback
old_import = "import React, { useState, useEffect } from 'react';"
new_import = "import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';"
content = content.replace(old_import, new_import, 1)
print(f"Import updated: {new_import in content}")

# 2. Add Type icon to lucide imports
old_logout = "  LogOut,\n} from 'lucide-react';"
new_logout = "  LogOut,\n  Type,\n} from 'lucide-react';"
content = content.replace(old_logout, new_logout, 1)
print(f"Type icon added: {'  Type,' in content}")

# 3. Add FontSize Context after the imports block (after the types import line)
old_types_import = "import { MedicalRecord, Medication, TestResult, GPSLog, DoctorNote, VitalSigns, UserProfile, ElderlyProfile, EmergencyContact } from './types';"
font_size_context = """
// --- Font Size Context ---

type FontSizeKey = 'small' | 'normal' | 'large' | 'xlarge';

const FONT_SIZE_OPTIONS: { key: FontSizeKey; label: string; px: number; desc: string }[] = [
  { key: 'small',  label: '\u5c0f',   px: 14, desc: '14px' },
  { key: 'normal', label: '\u6a19\u6e96', px: 16, desc: '16px' },
  { key: 'large',  label: '\u5927',   px: 19, desc: '19px' },
  { key: 'xlarge', label: '\u7279\u5927', px: 22, desc: '22px' },
];

interface FontSizeContextType {
  fontSize: FontSizeKey;
  setFontSize: (key: FontSizeKey) => void;
}

const FontSizeContext = createContext<FontSizeContextType>({
  fontSize: 'normal',
  setFontSize: () => {},
});

const useFontSize = () => useContext(FontSizeContext);

const FontSizeProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontSize, setFontSizeState] = useState<FontSizeKey>(() => {
    return (localStorage.getItem('fontSize') as FontSizeKey) || 'normal';
  });

  const applyFontSize = useCallback((key: FontSizeKey) => {
    const opt = FONT_SIZE_OPTIONS.find(o => o.key === key) || FONT_SIZE_OPTIONS[1];
    document.documentElement.style.fontSize = `${opt.px}px`;
  }, []);

  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize, applyFontSize]);

  const setFontSize = useCallback((key: FontSizeKey) => {
    setFontSizeState(key);
    localStorage.setItem('fontSize', key);
    applyFontSize(key);
  }, [applyFontSize]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};
"""
content = content.replace(old_types_import, old_types_import + "\n" + font_size_context, 1)
print(f"FontSizeProvider added: {'FontSizeProvider' in content}")

# 4. Add FontSizeSelector component before "// --- Main App ---"
main_app_marker = "// --- Main App ---"
font_size_selector = """// --- Font Size Selector Component ---

const FontSizeSelector = () => {
  const { fontSize, setFontSize } = useFontSize();

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">\u5b57\u9ad4\u5927\u5c0f</h3>
      <Card className="space-y-3">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
            <Type size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">\u986f\u793a\u5b57\u9ad4\u5927\u5c0f</p>
            <p className="text-xs text-slate-400">\u8abf\u6574\u5f8c\u5168 App \u540c\u6b65\u751f\u6548</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {FONT_SIZE_OPTIONS.map((opt) => {
            const isActive = fontSize === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setFontSize(opt.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95",
                  isActive
                    ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm shadow-violet-100"
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                )}
              >
                <span
                  className="font-bold leading-none"
                  style={{ fontSize: `${opt.px}px` }}
                >
                  A
                </span>
                <span className="text-[0.625rem] font-semibold tracking-wide">{opt.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[0.625rem] text-slate-400 text-center">
          \u76ee\u524d\uff1a{FONT_SIZE_OPTIONS.find(o => o.key === fontSize)?.desc || '16px'}
        </p>
      </Card>
    </div>
  );
};

"""
content = content.replace(main_app_marker, font_size_selector + main_app_marker, 1)
print(f"FontSizeSelector added: {'FontSizeSelector' in content}")

# 5. Add <FontSizeSelector /> in ProfileView after the GPS toggle card
# Find position: after the GPS tracking toggle section (before Backup Section)
old_backup_section = "      {/* Backup Section */}"
with_font_selector = "      {/* Font Size */}\n      <FontSizeSelector />\n\n      {/* Backup Section */}"
content = content.replace(old_backup_section, with_font_selector, 1)
print(f"FontSizeSelector placed in ProfileView: {'FontSizeSelector />' in content}")

# 6. Wrap App return with FontSizeProvider
old_return_div = '    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">'
new_return_div = '    <FontSizeProvider>\n    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">'
content = content.replace(old_return_div, new_return_div, 1)

old_end = '    </div>\n  );\n}\n'
new_end = '    </div>\n    </FontSizeProvider>\n  );\n}\n'
content = content.replace(old_end, new_end, 1)
print(f"FontSizeProvider wrapping added: {'</FontSizeProvider>' in content}")

# Write the final result
with open(target_path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content)

print("\nAll done! Final verification:")
with open(target_path, 'r', encoding='utf-8') as f:
    verify = f.read()
print(f"  File size: {len(verify)} chars")
print(f"  Chinese OK: {'\u65e9\u5b89' in verify}")
print(f"  text-[10px] remaining: {verify.count('text-[10px]')}")
print(f"  text-[0.625rem] count: {verify.count('text-[0.625rem]')}")
print(f"  FontSizeProvider: {'FontSizeProvider' in verify}")
print(f"  FontSizeSelector: {'FontSizeSelector' in verify}")
