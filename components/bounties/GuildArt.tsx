/** Original RobinHoot heraldic decoration. Not a character portrait or earned badge. */
export function GuildInsignia() {
  return <svg className="guild-insignia" viewBox="0 0 160 180" width="160" height="180" fill="none" aria-hidden="true">
    <path className="crest-halo" d="M80 5 147 44v75l-67 55-67-55V44Z" stroke="currentColor" strokeWidth=".6"/>
    <path d="M80 16 137 49v65l-57 47-57-47V49Z" fill="#101c17" stroke="currentColor" strokeWidth="2"/>
    <path d="m80 24 49 29v57l-49 41-49-41V53Z" stroke="currentColor" strokeWidth=".5"/>
    <path d="m43 54 29 18h16l29-18-7 51-30 31-30-31Z" fill="#a68b53" fillOpacity=".12" stroke="currentColor" strokeWidth="2"/>
    <path d="m43 54 18 44 19 38 19-38 18-44M51 84l22 15-11 10m47-25L87 99l11 10M73 119h14l-7 9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="m56 90 11 8-8 1m45-9-11 8 8 1" fill="currentColor"/>
    <path d="M21 116 9 124m130-8 12 8M8 132c4 17 18 29 35 31m-28-14-3-12 12 8m-2 11-2-12 12 9m120-21c-4 17-18 29-35 31m28-14 3-12-12 8m2 11 2-12-12 9M80 0v12m-5-6h10" stroke="currentColor"/>
    <path d="m74 157 6 7 6-7-6 19Z" fill="currentColor"/>
  </svg>;
}
const symbols: Record<string, React.ReactNode> = {
  'RH-C03': <><path d="M8 38q2-15 22-16 20 0 26 12l3-6v14l-3-4q-6 13-27 12-19-1-21-12Z"/><path d="M19 33v.5M9 42h17M30 48q4 3 9 1"/><path d="m16 22 2-10 5 6 4-8 4 8 5-6 2 10Z"/></>,
  'RH-C04': <><path d="M14 8h36v48H14Z"/><path d="M19 15h26M23 21h18M32 28a7 7 0 1 0 .1 0ZM24 45q8-8 16 0M20 50h24M14 8l-3-3m39 3 3-3"/></>,
  'RH-S03': <><path d="M16 12h30a5 5 0 0 1 0 10H46v28a6 6 0 0 1-6 6H14a6 6 0 0 1 0-12h4V18a6 6 0 0 1-2-6Z"/><path d="M18 44a6 6 0 0 1 6 6m22-38a5 5 0 0 0-5 5v5M24 26h16M24 32h16M24 38h10"/><path d="M10 8l5 4m40-4-5 4"/></>,
  'RH-G03': <><path d="M14 54 50 44M14 44l36 10"/><path d="M32 42c-9-2-12-10-7-17 1 5 4 6 5 6-2-8 2-15 9-19-2 8 6 11 6 20 0 6-5 10-13 10Z"/><path d="M32 42c-3-2-3-6 0-9 2 3 4 4 3 7"/></>,
  'RH-C01': <><path d="m10 17 14 7h16l14-7-5 28-17 12-17-12Z"/><path d="m17 31 10 5-8 3m28-8-10 5 8 3M25 46q7 7 14 0M26 21l6-11 6 11"/></>,
  'RH-C02': <><path d="m17 43 28-32 7 6-29 32Z M16 43c-8 1-2 11-9 13 12 2 17-1 16-8M37 14l13 12M17 15l4-7 3 7 7 3-7 3-3 7-4-7-7-3Z"/></>,
  'RH-S01': <><path d="M13 38v16h38V38M13 38l19 12 19-12M18 38l14-9 14 9M29 41C27 23 37 9 53 8 52 23 40 31 29 41Zm0 0L45 17M35 20l8 2m-11 5 7 2"/></>,
  'RH-S02': <><path d="M9 37q12-5 23 2 11-7 23-2v18q-11-5-23 1-12-6-23-1ZM32 39v17M32 9c4 10 12 10 10 19-2 8-18 9-20 0-1-6 4-10 4-10 0 9 7 6 6-9ZM15 43l11 3m12 0 11-3"/></>,
  'RH-G01': <><circle cx="32" cy="32" r="21"/><circle cx="32" cy="32" r="16"/><path d="m41 22-5 15-14 6 6-16Zm0 0-13 5 8 10M32 5v9m0 36v9M5 32h9m36 0h9"/></>,
  'RH-G02': <><path d="m19 19 29 29m-4-4 6-6m-10 2 6-6M45 19 16 48m4-4-6-6m10 2-6-6"/><circle cx="15" cy="15" r="8"/><circle cx="49" cy="15" r="8"/><path d="m32 9-4 7 4 7 4-7ZM26 55h12"/></>,
};
export function ContractSymbol({id}: {id: string}) {
  return <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{symbols[id]}</svg>;
}
export function RecognitionEmblem({path}: {path:'craft'|'story'|'service'}) {
  const symbol = path === 'craft' ? 'RH-C02' : path === 'story' ? 'RH-S01' : 'RH-G01';
  return <div className={`recognition-emblem emblem-${path}`} aria-hidden="true"><svg className="emblem-frame" viewBox="0 0 100 110" width="100" height="110" fill="none"><path d="m50 3 39 20v52l-39 30L11 75V23Z" fill="#152019" stroke="currentColor"/><path d="m50 10 32 17v44l-32 26-32-26V27Z" stroke="currentColor" strokeWidth=".5"/><path d="M4 32v39l15 15m77-54v39L81 86M44 4l6 8 6-8M40 103l10 5 10-5" stroke="currentColor"/></svg><ContractSymbol id={symbol}/></div>;
}
export function TreasuryChest() {
  return <svg className="treasury-chest" viewBox="0 0 440 270" width="440" height="270" fill="none" aria-hidden="true">
    <defs><linearGradient id="chest-wood" x1="80" y1="90" x2="340" y2="235" gradientUnits="userSpaceOnUse"><stop stopColor="#6b5132"/><stop offset=".45" stopColor="#33291d"/><stop offset="1" stopColor="#111b16"/></linearGradient><linearGradient id="chest-iron" x1="120" y1="70" x2="300" y2="240" gradientUnits="userSpaceOnUse"><stop stopColor="#bc9f62"/><stop offset=".4" stopColor="#756345"/><stop offset="1" stopColor="#333d2f"/></linearGradient></defs>
    <ellipse cx="220" cy="239" rx="152" ry="15" fill="#030907" fillOpacity=".7"/>
    <path d="m83 132 215 13 58-33-207-17Z" fill="#766044" stroke="#927a4e"/>
    <path d="M83 132v91l215 21v-99Z" fill="url(#chest-wood)" stroke="#a38b57"/>
    <path d="m298 145 58-33-7 95-51 37Z" fill="#18251b" stroke="#776b49"/>
    <path d="M83 132c0-52 31-76 67-75l162 12c30 2 46 14 44 43l-58 33Z" fill="url(#chest-wood)" stroke="#947d51" strokeWidth="2"/>
    <path d="M98 103 315 119m-218-29 205 15M103 164l180 15m-180 12 180 16M149 58c-30 0-47 29-47 74m187-64c-28 0-43 34-42 74" stroke="#bc9f6240"/>
    <path d="m119 61 16-3c-23 25-26 48-25 77l-14-1c-2-33 5-57 23-73ZM267 66l17 2c-26 20-29 47-27 74l-17-1c-1-31 4-56 27-75Z" fill="url(#chest-iron)" stroke="#a38b57"/>
    <path d="m99 136 14 1v91l-14-1Zm142 8 16 1v95l-16-2ZM84 215l213 21v8L84 223ZM298 235l51-36v8l-51 37Z" fill="url(#chest-iron)"/>
    <path d="m83 130 215 14 58-33v8l-58 33-215-14Z" fill="#ad955a"/>
    <path d="M179 141v24h30v-23m-26 21v-15c0-15 23-14 23 0v15" stroke="#c6ab6a" strokeWidth="5"/>
    <path d="m177 163 34 2v29l-17 10-17-13Z" fill="#3a4630" stroke="#c7ad70" strokeWidth="2"/>
    <circle cx="194" cy="178" r="3" fill="#dec992"/><path d="m194 180-2 7h4Z" fill="#dec992"/>
    <g fill="#c4a975"><circle cx="105" cy="153" r="2"/><circle cx="105" cy="208" r="2"/><circle cx="249" cy="164" r="2"/><circle cx="249" cy="222" r="2"/><circle cx="117" cy="88" r="2"/><circle cx="259" cy="96" r="2"/></g>
    <path d="m320 156 20-12-1 37-20 14Z" stroke="#64785b"/><path d="m325 163 9-5-1 15-9 7Z" stroke="#64785b"/>
  </svg>;
}
export function ArrowMark({down=false}:{down?:boolean}) {
  return <svg className="guild-arrow" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={down ? 'M8 2v12M3 9l5 5 5-5' : 'M3 13 13 3M3 3h10v10'}/></svg>;
}
