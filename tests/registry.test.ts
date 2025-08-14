/**
 * MCP Registry tests
 */

import { 
  MCP_SERVER_REGISTRY, 
  getServerByPackage, 
  getRequiredServers, 
  getOptionalServers,
  validateRegistry 
} from '../src/config/mcp-registry';

describe('MCP Registry', () => {
  test('registry should contain 8 servers', () => {
    expect(MCP_SERVER_REGISTRY).toHaveLength(8);
  });

  test('registry should validate successfully', () => {
    const validation = validateRegistry();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should find server by package name', () => {
    const server = getServerByPackage('@modelcontextprotocol/server-filesystem');
    expect(server).toBeDefined();
    expect(server?.name).toBe('Filesystem MCP');
  });

  test('should return undefined for non-existent package', () => {
    const server = getServerByPackage('non-existent-package');
    expect(server).toBeUndefined();
  });

  test('should get required servers', () => {
    const required = getRequiredServers();
    expect(required.length).toBeGreaterThan(0);
    expect(required.every(server => !server.optional)).toBe(true);
  });

  test('should get optional servers', () => {
    const optional = getOptionalServers();
    expect(optional.every(server => server.optional)).toBe(true);
  });

  test('each server should have required fields', () => {
    for (const server of MCP_SERVER_REGISTRY) {
      expect(server.name).toBeTruthy();
      expect(server.package).toBeTruthy();
      expect(server.version).toBeTruthy();
      expect(server.description).toBeTruthy();
    }
  });
});