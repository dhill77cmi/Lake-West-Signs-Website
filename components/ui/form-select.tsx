"use client";

import { useSyncExternalStore, type AriaAttributes } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const touchQuery = "(pointer: coarse)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(touchQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const touchSnapshot = () => window.matchMedia(touchQuery).matches;
const serverSnapshot = () => false;

type FormSelectProps = AriaAttributes & {
  id: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: ReadonlyArray<{ value: string; label: string }>;
};

// Native pickers handle touch scrolling and the on-screen keyboard; pointer users
// keep the existing styled menu. Both expose a single successful form control.
export function FormSelect({ id, name, value, onValueChange, placeholder, options, ...aria }: FormSelectProps) {
  const touch = useSyncExternalStore(subscribe, touchSnapshot, serverSnapshot);
  if (touch) return <select id={id} name={name} value={value} onChange={event => onValueChange(event.target.value)} className="ui-control" {...aria}>
    <option value="" disabled>{placeholder}</option>
    {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>;
  return <Select name={name} value={value} onValueChange={onValueChange}>
    <SelectTrigger id={id} {...aria}><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent><SelectGroup>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent>
  </Select>;
}
