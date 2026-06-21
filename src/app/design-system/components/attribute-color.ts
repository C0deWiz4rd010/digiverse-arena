/** Maps a Digimon attribute name to its themed CSS color variable. */
export function attributeColorVar(attribute: string | null | undefined): string {
  switch ((attribute ?? '').trim().toLowerCase()) {
    case 'vaccine':
      return 'var(--color-vaccine)';
    case 'virus':
      return 'var(--color-virus)';
    case 'data':
      return 'var(--color-data)';
    case 'free':
    case 'variable':
      return 'var(--color-free)';
    default:
      return 'var(--color-unknown)';
  }
}
