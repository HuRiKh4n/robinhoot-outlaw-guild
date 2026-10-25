import type { OutlawDraft } from '@/lib/profile/draft';
import { clothing, ears, equipment, faceMarks, palette } from './layers';

/** All geometry is authored locally; no text input, external URLs or runtime art service. */
export function characterSvg(draft: OutlawDraft): string {
  const animal = Object.prototype.hasOwnProperty.call(palette, draft.species) ? draft.species : 'Raccoon';
  const [fur, light, shadow] = palette[animal];
  const wear = clothing[draft.outfit as keyof typeof clothing] ?? clothing['Patched Cloak'];
  const gear = equipment[draft.class] ?? equipment.Scout;
  const eye = draft.personality === 'Fearless' ? '#e9bc60' : draft.personality === 'Chaotic' ? '#a9c293' : '#c8b87d';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="620" viewBox="0 0 480 620">
  <defs>
    <radialGradient id="back"><stop stop-color="#5c4a2c"/><stop offset="1" stop-color="#151c19"/></radialGradient>
    <linearGradient id="fur" x2=".8" y2="1"><stop stop-color="${light}"/><stop offset=".45" stop-color="${fur}"/><stop offset="1" stop-color="${shadow}"/></linearGradient>
    <linearGradient id="cloak" x2="1" y2=".4"><stop stop-color="#252e25"/><stop offset=".4" stop-color="#586046"/><stop offset="1" stop-color="#202a24"/></linearGradient>
    <linearGradient id="leather" x2="1" y2="1"><stop stop-color="#a17a4b"/><stop offset=".5" stop-color="#65452e"/><stop offset="1" stop-color="#322a24"/></linearGradient>
    <linearGradient id="steel" x2="1" y2=".3"><stop stop-color="#3d4b4b"/><stop offset=".45" stop-color="#b4bbad"/><stop offset=".6" stop-color="#667975"/><stop offset="1" stop-color="#2c393a"/></linearGradient>
    <pattern id="grain" width="23" height="31" patternUnits="userSpaceOnUse"><path d="m3 4 2 4m12 9 2-3m-6 10 1 3" stroke="#dac59a" stroke-opacity=".11" stroke-width="1"/></pattern>
  </defs>
  <rect width="480" height="620" rx="16" fill="url(#back)"/>
  <g fill="none" stroke="#b69a57" opacity=".16"><circle cx="240" cy="255" r="187"/><circle cx="240" cy="255" r="178"/><path d="M240 48v30m0 355v30M34 255h30m352 0h30"/></g>
  <path fill="#101713" opacity=".8" d="m0 550 62-95 32 27 36-48 41 30 35-30 52 39 35-19 50 39 35-20 102 77v70H0z"/>
  <ellipse fill="#090f0d" opacity=".65" cx="240" cy="574" rx="153" ry="24"/>
  <g stroke="#221f19" stroke-width="4" stroke-linejoin="round">
    ${animal === 'Bear' || animal === 'Rabbit' ? '<ellipse fill="url(#fur)" cx="332" cy="496" rx="28" ry="25"/>' : animal === 'Owl' ? '<path fill="url(#fur)" d="m303 433 63 99-16 23-38-47-12-25z"/>' : `<path fill="${fur}" d="m315 400q112 23 90 118-17 73-100 31l-32-33q115 55 83-58z"/>`}
    ${animal === 'Fox' ? '<path fill="#e6c49a" d="m362 490 43 28q-17 73-100 31l-21-21q65 29 78-38z"/>' : ''}
    ${animal === 'Raccoon' ? '<path fill="none" stroke="#332e29" stroke-width="16" d="m356 438 27 15m-21 21 34 17m-35 17 29 19"/>' : ''}
    <path fill="#342d25" d="m182 477-20 87-13 20 65 1 28-99 20 99h66l-20-21-15-87z"/>
    <path fill="url(#leather)" d="m166 548 54 8-6 30h-65zm98 8 50-8 15 38h-65z"/>
    <path fill="url(#leather)" d="m168 308-44 36 8 150 108 31 108-31 8-150-44-36z"/>
    ${wear}
    <path fill="url(#leather)" d="m138 348-29 19-20 102 35 12 33-104zm204 0 29 19 20 102-35 12-33-104z"/>
    <path fill="${fur}" d="m89 461-8 28 13 18 24-8 6-27zm302 0 8 28-13 18-24-8-6-27z"/>
    <path fill="#322a23" d="m140 474 100 20 100-20 2 27-102 20-102-20z"/><rect fill="#ad8e54" x="223" y="488" width="34" height="28" rx="3"/><rect fill="#342d25" x="232" y="494" width="16" height="15"/>
    <path fill="url(#fur)" d="m206 270-14 64 48 34 48-34-14-64z"/>
    <g fill="url(#fur)">${ears[animal]}</g>
    <path fill="url(#fur)" d="M158 158q82-47 164 0l24 61-14 62-32 27-27 5-33 16-33-16-27-5-32-27-14-62z"/>
    ${faceMarks[animal]}
    <path fill="none" stroke="${light}" stroke-width="3" opacity=".6" d="m157 177 21-9m-28 28 22-11m-27 31 20-10m158-29-21-9m28 28-22-11m27 31-20-10"/>
    <path fill="#252a24" d="m168 202 47 10-8 19-32-5zm144 0-47 10 8 19 32-5z"/>
    <path fill="${eye}" stroke-width="2" d="m175 213 32 5-6 9-20-3zm130 0-32 5 6 9 20-3z"/><path stroke="#131c18" stroke-width="4" d="m192 216 1 10m94-10-1 10"/>
    ${animal === 'Owl' ? '<path fill="#bd9149" d="m240 231 17 17-17 29-17-29z"/>' : '<path fill="#302821" d="m223 255 17-7 17 7-6 14-11 6-11-6z"/>'}
    <path fill="none" stroke-width="3" d="m240 275 0 13-18 8m18-8 18 8"/>
    <path stroke="#bfa57d" stroke-width="2" opacity=".65" d="m294 174-8 29m15-19-9-3m6 13-9-3"/>
    <path fill="#765a34" d="m194 315 46 28 46-28-13 25-33 17-33-17z"/><circle fill="#c1a66a" cx="240" cy="342" r="9"/>
    ${gear}
  </g>
  <rect width="480" height="620" rx="16" fill="url(#grain)"/>
  <g fill="#d7ae63" opacity=".6"><circle cx="71" cy="369" r="1.5"/><circle cx="407" cy="130" r="2"/><circle cx="97" cy="95" r="1"/><circle cx="404" cy="560" r="1.5"/></g>
  </svg>`;
}
