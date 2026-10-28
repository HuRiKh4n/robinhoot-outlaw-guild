'use client';

import { useId, useRef, useState } from 'react';
import { classDraft, classes, offeredSpecies, outfitsFor, type OutlawDraft } from '@/lib/profile/draft';
import { DETAILS, MAX_DETAILS, detailLabel } from '@/lib/character/details';
import { resolveAppearance } from '@/lib/character/appearance';
import { useSound } from '@/components/sound/SoundProvider';

const groups = [
  { field: 'species', label: 'Species', choices: offeredSpecies },
  { field: 'class', label: 'Class', choices: classes },
  { field: 'outfit', label: 'Outfit', choices: [] as readonly string[] },
  { field: 'details', label: 'Marks', choices: DETAILS.map(detail => detail.id) },
] as const;
type Field = typeof groups[number]['field'];

export default function ChoiceDeck({ draft, disabled, onChange }: {
  draft: OutlawDraft; disabled: boolean;
  onChange: <K extends keyof OutlawDraft>(field: K, value: OutlawDraft[K]) => void;
}) {
  const [active, setActive] = useState(0);
  const { play } = useSound();
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const group = groups[active];
  function move(index: number) { setActive(index); tabs.current[index]?.focus(); }
  return <div className="choice-deck">
    <div className="choice-tabs" role="tablist" aria-label="Customize your character">
      {groups.map((item, index) => <button key={item.field} ref={node => { tabs.current[index] = node; }} type="button" role="tab" id={`${id}-${item.field}`} aria-controls={`${id}-panel-${item.field}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => {
        let next: number | undefined;
        if (event.key === 'ArrowRight') next = (index + 1) % groups.length;
        if (event.key === 'ArrowLeft') next = (index + groups.length - 1) % groups.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = groups.length - 1;
        if (next !== undefined) { event.preventDefault(); move(next); }
      }}>{item.label}<span>{item.field === 'details' ? (draft.details.length ? draft.details.map(detailLabel).join(', ') : 'None yet') : draft[item.field]}</span></button>)}
    </div>
    {groups.map((item, index) => <div key={item.field} role="tabpanel" id={`${id}-panel-${item.field}`} aria-labelledby={`${id}-${item.field}`} hidden={active !== index}>
      {active === index && group.field === 'details' && <fieldset className="choice-panel"><legend>YOUR MARKS · UP TO {MAX_DETAILS}</legend>
        <div className="choice-grid">{DETAILS.map(detail => {
          const on = draft.details.includes(detail.id);
          const full = !on && draft.details.length >= MAX_DETAILS;
          return <label className={`choice-card${on ? ' is-selected' : ''}`} key={detail.id}>
            <input type="checkbox" aria-label={detail.label} checked={on} disabled={disabled || full} onChange={() => { play('coin'); onChange('details', on ? draft.details.filter(id => id !== detail.id) : [...draft.details, detail.id]); }} />
            <span className="choice-card-copy"><strong>{detail.label}</strong><small>{full ? 'Three marks max' : 'Painted on your portrait'}</small></span><span className="choice-check" aria-hidden="true">{on ? '✓' : '+'}</span>
          </label>;
        })}</div>
        <p className="choice-help">Pick up to three marks. The guild painter adds them to your portrait when you join the Guild.</p>
      </fieldset>}
      {active === index && group.field !== 'details' && <fieldset className="choice-panel"><legend>{`YOUR ${group.label.toUpperCase()}`}</legend>
        <div className="choice-grid">{(group.field === 'outfit' ? outfitsFor(draft.class) : group.field === 'species' && !group.choices.includes(draft.species as never) ? [...group.choices, draft.species] : group.choices).map(value => {
          const next = group.field === 'class' ? classDraft(draft, value as OutlawDraft['class']) : { ...draft, [group.field]: value } as OutlawDraft;
          const art = resolveAppearance(next);
          const metadata = false;
          const exact = art.kind === 'cinematic';
          const thumbnail = exact && !metadata ? art.thumb : undefined;
          const status = metadata ? 'Story detail' : exact ? art.label.includes('fallback') ? 'Original portrait fallback' : 'Cinematic artwork' : 'Artwork unavailable';
          return <label className={`choice-card${draft[group.field] === value ? ' is-selected' : ''}`} key={value}>
            <input type="radio" name={`${id}-${group.field}-choice`} aria-label={value} value={value} checked={draft[group.field] === value} disabled={disabled} onChange={() => { play('coin'); onChange(group.field as Field, value as OutlawDraft[Field]); }} />
            {thumbnail && <img src={thumbnail} width={art.width} height={art.height} alt="" loading="lazy" decoding="async" />}
            <span className="choice-card-copy"><strong>{value}</strong><small>{status}</small></span><span className="choice-check" aria-hidden="true">{draft[group.field] === value ? '✓' : '+'}</span>
          </label>;
        })}</div>
        <p className="choice-help">{group.field === 'outfit' ? 'Choose a class outfit.' : 'Pick the one that feels like you.'}</p>
      </fieldset>}
    </div>)}
  </div>;
}
