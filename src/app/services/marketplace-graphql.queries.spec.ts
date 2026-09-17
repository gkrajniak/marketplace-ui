import { getMarketplaceEntriesQuery } from './marketplace-graphql.queries';
import { print } from 'graphql';

describe('getMarketplaceEntriesQuery', () => {
  it('requests the generic provider UI extension context', () => {
    const query = print(getMarketplaceEntriesQuery);

    expect(query).toContain('data');
    expect(query).toContain('documentation {');
    expect(query).toContain('displayName');
    expect(query).toContain('detailViewExtensions {');
    expect(query).toContain('url');
    expect(query).toContain('links {');
    expect(query).toContain('main');
    expect(query).not.toContain('mainLink');
    expect(query).toContain('tags');
    expect(query).not.toContain('labels {');
    expect(query).not.toContain('category');
    expect(query).not.toContain('type');
  });
});
