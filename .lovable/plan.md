

## Plan: Draggable Skill Cards + Help Update

### Part 1: Make Skill Cards Draggable

**File:** `src/pages/Capabilities.tsx`

Use framer-motion's `Reorder` component (already installed) to make the skill library cards drag-and-drop reorderable, with order persisted in `localStorage`.

**Changes:**
1. Add `import { Reorder } from "framer-motion"` (line 2 area)
2. Add `skillOrder` state initialized from `localStorage` key `apex-skill-order`
3. After filtering (line 294-299), sort `filtered` by the saved order (unordered skills appended at end)
4. Replace the grid `<div>` at line 451 with `<Reorder.Group axis="y" values={orderedSkills} onReorder={handleReorder}>` keeping the same grid CSS classes
5. Wrap each `<Card>` (line 459) in `<Reorder.Item key={skill.id} value={skill}>`
6. On reorder, save new order to state + `localStorage`
7. Show `GripVertical` icon (already imported) on hover as a drag affordance

**Key logic:**
```typescript
const [skillOrder, setSkillOrder] = useState<string[]>(() => {
  try { return JSON.parse(localStorage.getItem("apex-skill-order") || "[]"); }
  catch { return []; }
});

const orderedSkills = [...filtered].sort((a, b) => {
  const ai = skillOrder.indexOf(a.id), bi = skillOrder.indexOf(b.id);
  if (ai === -1 && bi === -1) return 0;
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
});

const handleReorder = (newOrder: Skill[]) => {
  const ids = newOrder.map(s => s.id);
  setSkillOrder(ids);
  localStorage.setItem("apex-skill-order", JSON.stringify(ids));
};
```

### Part 2: Update Help Documentation

**File:** `src/pages/Help.tsx`

Add a note in the Capabilities/Skill Library section mentioning that skill cards can be reordered by dragging, and that the custom order is remembered across sessions.

### Files Changed
- `src/pages/Capabilities.tsx` — add Reorder wrapper, order state, drag handle
- `src/pages/Help.tsx` — document drag-to-reorder feature

