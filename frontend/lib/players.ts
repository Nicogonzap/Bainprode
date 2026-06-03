/**
 * Jugadores por selección (Mundial 2026).
 *
 * ⚠️ LISTA PROVISORIA / HARDCODEADA.
 * Son figuras conocidas de cada selección a la fecha de armado, NO las listas
 * oficiales de 26 (que FIFA confirma recién en junio 2026). Sirve para que el
 * usuario elija de un menú en vez de tipear a mano.
 *
 * TODO (revisar con el equipo antes del Mundial):
 *  - Reemplazar por listas oficiales de 26 cuando se confirmen.
 *  - Idealmente mover esto a Supabase (tabla de jugadores) para no hardcodear.
 *
 * Las claves son los códigos de país de lib/groups.ts (ej: ARG, BRA, ALE...).
 */
 
export const PLAYERS_BY_COUNTRY: Record<string, string[]> = {
  // Grupo A
  NED: ['Virgil van Dijk', 'Frenkie de Jong', 'Cody Gakpo', 'Memphis Depay', 'Xavi Simons'],
  POL: ['Robert Lewandowski', 'Piotr Zieliński', 'Nicola Zalewski', 'Jakub Kiwior'],
  NOR: ['Erling Haaland', 'Martin Ødegaard', 'Alexander Sørloth', 'Antonio Nusa'],
  JAM: ['Michail Antonio', 'Leon Bailey', 'Demarai Gray'],
 
  // Grupo B
  ENG: ['Harry Kane', 'Jude Bellingham', 'Bukayo Saka', 'Phil Foden', 'Cole Palmer'],
  USA: ['Christian Pulisic', 'Weston McKennie', 'Gio Reyna', 'Folarin Balogun'],
  IRN: ['Mehdi Taremi', 'Sardar Azmoun', 'Alireza Jahanbakhsh'],
  ECU: ['Enner Valencia', 'Moisés Caicedo', 'Kendry Páez'],
 
  // Grupo C
  FRA: ['Kylian Mbappé', 'Antoine Griezmann', 'Ousmane Dembélé', 'Aurélien Tchouaméni', 'Michael Olise'],
  DEN: ['Christian Eriksen', 'Rasmus Højlund', 'Pierre-Emile Højbjerg'],
  TUN: ['Hannibal Mejbri', 'Youssef Msakni', 'Naïm Sliti'],
  AUS: ['Mathew Leckie', 'Jackson Irvine', 'Riley McGree'],
 
  // Grupo D
  CAN: ['Alphonso Davies', 'Jonathan David', 'Cyle Larin', 'Tajon Buchanan'],
  BEL: ['Kevin De Bruyne', 'Romelu Lukaku', 'Jérémy Doku', 'Youri Tielemans'],
  CRO: ['Luka Modrić', 'Joško Gvardiol', 'Mateo Kovačić', 'Andrej Kramarić'],
  MAR: ['Achraf Hakimi', 'Hakim Ziyech', 'Youssef En-Nesyri', 'Brahim Díaz'],
 
  // Grupo E
  ALE: ['Jamal Musiala', 'Florian Wirtz', 'Kai Havertz', 'Joshua Kimmich', 'Ilkay Gündoğan'],
  JPN: ['Takefusa Kubo', 'Kaoru Mitoma', 'Wataru Endō', 'Daizen Maeda'],
  KOR: ['Son Heung-min', 'Lee Kang-in', 'Kim Min-jae', 'Hwang Hee-chan'],
  GHA: ['Mohammed Kudus', 'Thomas Partey', 'Iñaki Williams', 'Jordan Ayew'],
 
  // Grupo F
  BRA: ['Vinícius Júnior', 'Rodrygo', 'Raphinha', 'Endrick', 'Bruno Guimarães'],
  CMR: ['André Onana', 'Vincent Aboubakar', 'Bryan Mbeumo'],
  SUI: ['Granit Xhaka', 'Breel Embolo', 'Manuel Akanji', 'Dan Ndoye'],
  SRB: ['Dušan Vlahović', 'Aleksandar Mitrović', 'Sergej Milinković-Savić'],
 
  // Grupo G
  ITA: ['Federico Chiesa', 'Nicolò Barella', 'Gianluigi Donnarumma', 'Mateo Retegui'],
  COL: ['James Rodríguez', 'Luis Díaz', 'Jhon Durán', 'Rafael Santos Borré'],
  CIV: ['Sébastien Haller', 'Franck Kessié', 'Simon Adingra'],
  WAL: ['Aaron Ramsey', 'Brennan Johnson', 'Harry Wilson'],
 
  // Grupo H
  ESP: ['Lamine Yamal', 'Pedri', 'Rodri', 'Nico Williams', 'Álvaro Morata'],
  CRC: ['Keylor Navas', 'Joel Campbell', 'Manfred Ugalde'],
  SEN: ['Sadio Mané', 'Nicolas Jackson', 'Ismaïla Sarr', 'Kalidou Koulibaly'],
  NZL: ['Chris Wood', 'Marco Rojas', 'Liberato Cacace'],
 
  // Grupo I
  POR: ['Cristiano Ronaldo', 'Bruno Fernandes', 'Bernardo Silva', 'Rafael Leão', 'João Félix'],
  URY: ['Federico Valverde', 'Darwin Núñez', 'Ronald Araújo', 'Facundo Pellistri'],
  AUT: ['David Alaba', 'Marcel Sabitzer', 'Konrad Laimer'],
  EGY: ['Mohamed Salah', 'Omar Marmoush', 'Trézéguet'],
 
  // Grupo J
  ARG: ['Lionel Messi', 'Julián Álvarez', 'Lautaro Martínez', 'Enzo Fernández', 'Alexis Mac Allister'],
  ARS: ['Salem Al-Dawsari', 'Firas Al-Buraikan', 'Salman Al-Faraj'],
  MEX: ['Hirving Lozano', 'Santiago Giménez', 'Edson Álvarez', 'Raúl Jiménez'],
  NGA: ['Victor Osimhen', 'Ademola Lookman', 'Samuel Chukwueze'],
 
  // Grupo K
  TUR: ['Arda Güler', 'Hakan Çalhanoğlu', 'Kenan Yıldız', 'Kerem Aktürkoğlu'],
  PAR: ['Miguel Almirón', 'Julio Enciso', 'Antonio Sanabria'],
  QAT: ['Akram Afif', 'Almoez Ali', 'Hassan Al-Haydos'],
  JOR: ['Mousa Al-Tamari', 'Yazan Al-Naimat', 'Mahmoud Al-Mardi'],
 
  // Grupo L
  VEN: ['Salomón Rondón', 'Yeferson Soteldo', 'Jefferson Savarino'],
  PAN: ['Adalberto Carrasquilla', 'José Fajardo', 'Michael Murillo'],
  UZB: ['Eldor Shomurodov', 'Abbosbek Fayzullaev'],
  HON: ['Anthony Lozano', 'Luis Palma', 'Romell Quioto'],
}
 
/** Devuelve los jugadores de un país por su código, o [] si no hay. */
export function getPlayersByCountry(code: string): string[] {
  return PLAYERS_BY_COUNTRY[code] ?? []
}