/** Original local vector assets. Shared 480×620 registration; never embed user input. */
export const palette = {
  Fox: ['#b85c2c', '#e2a76c', '#48281f'], Wolf: ['#737e80', '#bcc0af', '#303c42'],
  Raccoon: ['#8d8674', '#c8bfa4', '#352f29'], Bear: ['#704a33', '#ba8b59', '#35251e'],
  Rabbit: ['#a5937c', '#dfc5a4', '#594237'], Badger: ['#716c60', '#d6cfb6', '#292b29'],
  Owl: ['#8d714a', '#dac491', '#453622'],
} as const;

export const ears = {
  Fox: '<path d="M154 194 133 83 212 147M269 147 347 83 326 196"/><path fill="#492d2a" d="m160 151-10-43 42 45m97 0 42-45-11 45"/>',
  Wolf: '<path d="m152 194 4-109 63 63m44-1 63-62 2 111"/><path fill="#39454b" d="m171 153 1-38 29 38m81 0 29-38 2 40"/>',
  Raccoon: '<circle cx="159" cy="147" r="38"/><circle cx="321" cy="147" r="38"/><circle fill="#352f29" cx="159" cy="147" r="22"/><circle fill="#352f29" cx="321" cy="147" r="22"/>',
  Bear: '<circle cx="155" cy="149" r="45"/><circle cx="325" cy="149" r="45"/><circle fill="#422d25" cx="155" cy="149" r="26"/><circle fill="#422d25" cx="325" cy="149" r="26"/>',
  Rabbit: '<path d="M172 180Q111 27 160 23q43 7 54 133m51 1Q277 16 318 27q35 18-9 153"/><path fill="#966e62" d="M178 139q-41-106-19-99 27 18 36 111m85-2q13-100 34-106 12 14-17 110"/>',
  Badger: '<circle cx="157" cy="157" r="32"/><circle cx="323" cy="157" r="32"/><circle fill="#292b29" cx="157" cy="157" r="17"/><circle fill="#292b29" cx="323" cy="157" r="17"/>',
  Owl: '<path d="m152 186-15-90 72 48m62 0 72-48-15 92"/><path fill="#dac491" d="m153 143 5 37 34-27m96 0 34 27 5-37"/>',
};

export const faceMarks = {
  Fox: '<path fill="#e6c49a" d="m147 216 66 30 27 40 28-40 66-30-26 73-68 29-68-29z"/>',
  Wolf: '<path fill="#c8c8b0" d="m145 218 59 22 36 46 36-46 59-22-28 70-67 37-67-37z"/><path fill="#49575b" d="m211 169 29 18 29-18-15 61h-28z"/>',
  Raccoon: '<path fill="#342f2b" d="m147 191 81 16-15 43-68-26zm186 0-81 16 15 43 68-26z"/><path fill="#d6c8aa" d="m216 180 24-19 24 19-12 70h-24zM196 261q44-34 88 0l-10 39h-68z"/>',
  Bear: '<ellipse fill="#c39b6a" cx="240" cy="272" rx="59" ry="43"/><path stroke="#473023" fill="none" d="m185 171 28-7m54 0 28 7"/>',
  Rabbit: '<path fill="#ead8b8" d="m171 237 45 5 24 35 24-35 45-5-17 55-52 28-52-28z"/><path fill="#e7dfc8" d="M227 286h26v22h-26z"/>',
  Badger: '<path fill="#ded7bf" d="m214 151 26-7 26 7-13 141h-26zM146 175l52 5-13 102-33-27zm188 0-52 5 13 102 33-27z"/><path fill="#282a28" d="m171 183 44 22-17 41-33-15zm138 0-44 22 17 41 33-15z"/>',
  Owl: '<path fill="#d6bd88" d="M149 203q39-71 91 2 52-73 91-2l-13 61-78 43-78-43z"/><path fill="#a47c48" d="m169 282 22 9-8 16m24-8 20 9-10 16m36-16 20-9-7 25m30-33 22-9-14 25"/>',
};

export const clothing = {
  'Patched Cloak': '<path fill="url(#cloak)" d="m171 305-57 33-31 209 38-22 19 47 27-14 26 21 32-17 43 18 37-23 26 11 20-42 37 18-42-208-45-31z"/><path fill="#765c3b" d="m119 417 42-5-7 58-39 5zM294 487l37-10 12 46-38 7z"/><path stroke="#d4bd8a" stroke-width="2" fill="none" stroke-dasharray="4 6" d="m122 419 35-4-6 53-33 5zM298 489l29-8 11 39-30 6z"/>',
  'Ragged Hood': '<path fill="url(#cloak)" d="m173 300-65 51-21 178 34-10 19 34 33-15 31 24 35-22 48 17 27-30 36 12 36-9-28-174-53-60z"/><path fill="#3b4532" d="M124 255q-14-176 116-178 130 2 116 178l-38 62-40-16 52-53q-12-117-90-118-78 1-90 118l52 53-40 16z"/><path fill="none" stroke="#9c9264" stroke-width="4" d="M136 250q-8-151 104-159 112 8 104 159"/>',
  'Worn Leather Vest': '<path fill="url(#leather)" d="m166 314-42 33 19 166 97 34 97-34 19-166-42-33-74 41z"/><path fill="#503b2c" d="m165 313 75 42-35 76-35-67zm150 0-75 42 35 76 35-67z"/><path stroke="#d1ad70" stroke-width="2" fill="none" stroke-dasharray="4 5" d="m147 358 12 140 71 26m103-166-12 140-71 26"/><path stroke="#a48b60" stroke-width="4" d="m225 389 30 15-30 20 30 20-30 20 30 17"/>',
};

export const equipment = {
  Ranger: '<g fill="none" stroke="#b28a52" stroke-width="10"><path d="M365 258q111 141 3 283"/><path stroke="#d8c9a1" stroke-width="2" d="m368 258 0 283"/></g><g stroke="#dbccac" stroke-width="3"><path d="m117 347-24-155m20 158-3-149m12 148 2-158"/></g><path fill="#7b4f30" d="m87 318 42-7 20 130-43 9z"/><path stroke="#ddc9a0" d="m88 208 12-8m7 16 10-10m5 3 10-10"/>',
  Rogue: '<g transform="rotate(-27 339 439)"><path fill="url(#steel)" d="m330 351 18 0 0 112-9 24-9-24z"/><path fill="#a88343" d="M313 461h52v10h-52z"/><path fill="#342e27" d="M332 472h14v48h-14z"/></g><path fill="#65503a" d="m165 438 27 3-3 41-27-3zM201 443h26v40h-26z"/>',
  Warrior: '<g transform="rotate(17 351 397)"><path fill="url(#steel)" d="m340 225 18 0 9 241-18 25-18-25z"/><path stroke="#fff0c7" fill="none" d="m349 239 0 214"/><path fill="#aa8249" d="M314 472h70v14h-70z"/><path fill="#342c28" d="M340 487h18v63h-18z"/><circle fill="#aa8249" cx="349" cy="552" r="13"/></g><path fill="url(#steel)" d="m125 333 52-28 25 35-47 37z"/>',
  Mage: '<path stroke="#695036" stroke-width="14" d="m367 552 0-327"/><path stroke="#d0b874" stroke-width="3" d="m361 263 12 4m-12 12 12 4m-12 12 12 4"/><path fill="#93c4b1" stroke="#e0d4a6" stroke-width="3" d="m367 153 22 37-22 37-22-37z"/><circle fill="none" stroke="#8fbea9" stroke-width="2" cx="367" cy="190" r="44"/><path fill="#5c5269" d="m182 345 58 31 58-31-19 37-39 17-39-17z"/><circle fill="#cebb7b" cx="240" cy="386" r="9"/>',
  Scout: '<path fill="#645238" d="m163 399-45 25 12 54 49-19z"/><circle fill="#b59b62" stroke="#3e3326" stroke-width="5" cx="288" cy="425" r="26"/><path fill="#ebe0b8" d="m288 405 9 20-9 20-9-20z"/><path stroke="#b59b62" stroke-width="4" d="m277 403-24-56"/>',
  Trickster: '<path fill="#815d42" d="m282 404 46 11-11 68-42-11z"/><path fill="#d6c18a" stroke="#4d382c" d="m290 423 25 5-5 36-25-5z"/><path fill="#a43f2e" d="m301 433 5 13-9 9-6-13z"/><path fill="#a17c43" d="m156 420 25-3 8 42-22 4z"/><circle fill="#d1ba79" cx="172" cy="444" r="9"/>',
  Guardian: '<path fill="#5d5039" stroke="#b49c68" stroke-width="7" d="m332 348 54 30-8 95-46 46-46-46-8-95z"/><path fill="url(#steel)" d="m332 365 34 23-5 73-29 32-29-32-5-73z"/><path fill="#8f3d29" d="m332 392 15 27-15 30-15-30z"/>',
};
