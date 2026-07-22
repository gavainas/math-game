// Carteles de Benja: una frase corta la primera vez que aparece cada
// mecánica, salteable con un toque. Excepción pedida por el autor a la regla
// "sin texto instructivo" (GAMEFEEL.md 12): corto, rioplatense y una sola vez.

export const CARTELES_BENJA: Record<string, string> = {
  'm1-n01': '¡Arrastrá los brotes hasta los casilleros!',
  'm1-n03': 'Mirá los paquetes de arriba: ¡plantá esos grupos tocando la tierra!',
  'm1-n12': 'Ahora al revés: armá una grilla que tenga justo ese número.',
  'm1-n16': '¿Cuántos brotes hay? Llevá el número a la caja.',
  'm1-n18': '¡Apareció el ×! 3 × 4 es lo mismo que 3 grupos de 4.',
  'm2-n01': 'Tocá un amigo para darle una manzana. ¡Repartí parejo!',
  'm2-n05': 'Si sobra una, se queda al costado. ¡No pasa nada!',
  'm2-n09': 'Cada amigo quiere esa cantidad. ¿Cuántos entran? Sumalos con el +.',
  'm2-n13': '¡Apareció el ÷! 20 ÷ 4 es repartir 20 entre 4.',
  'm2-n19': '¿Cuánto le toca a cada uno? Llevá el número a la caja.',
  'm4-n01': 'Sacá lo mismo de los DOS lados. ¡Dejá el cofre solo!',
  'm4-n07': 'Tocá un número y se resta del otro lado.',
  'm4-n11': '¿Ves la x de arriba? ¡Es el cofre escrito en matemática!',
  'm4-n14': 'Cofres solos: tocalos y se reparten el número.',
};

export function idBase(nivelId: string): string {
  return nivelId.replace(/--repaso\d+$/, '');
}
