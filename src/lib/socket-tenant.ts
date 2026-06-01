/** Socket.io room name for a tenant subdomain. */
export function tenantRoom(subdomain: string): string {
  return `tenant:${subdomain.toLowerCase()}`;
}
