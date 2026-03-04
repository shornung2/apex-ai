UPDATE public.skill_pack_templates
SET skill_template = jsonb_set(skill_template, '{schedulable}', 'true')
WHERE skill_template->>'name' IN (
  'competitive-battle-card',
  'pipeline-review-prep',
  'win-loss-analysis',
  'seo-blog-brief',
  'linkedin-post-series',
  'company-research-brief',
  'market-intelligence-brief',
  'thought-leadership-article',
  'account-expansion-map'
)