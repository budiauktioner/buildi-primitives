/** Type of identifier parsed by the unified organization identifier parser. */
export enum SwedishOrganizationIdentifierType {
  Unknown = 0,

  SwedishOrganizationNumber = 1,
  SwedishPersonalIdentityNumber = 2,
  SwedishCoordinationNumber = 3,

  EuVatNumber = 10,
  DunsNumber = 20,
  LeiCode = 30,
}
