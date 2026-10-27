/** Validate each card against its registry row, independent of aria-label copy. */
export function assertPackageVersions(packages, actual) {
  for (const pkg of packages) {
    if (!pkg.version) continue;
    const cards=actual.filter(card=>card.slug===pkg.slug);
    if(cards.length!==1) throw new Error(`${pkg.slug}: expected one published card, found ${cards.length}`);
    const card=cards[0], source=pkg.install?.source==='git'?'git':'npm';
    if(card.version===undefined || card.source===undefined) throw new Error(`${pkg.slug}: published card lacks structured version/source attributes`);
    const visible=card.text?.match(/\bv(\d+\.\d+\.\d+(?:-[\w.-]+)?)(?![\w.])/u)?.[1];
    if(card.version!==pkg.version || card.source!==source || visible!==pkg.version)
      throw new Error(`${pkg.slug}: published version/source differs from registry ${source} ${pkg.version}`);
  }
}
