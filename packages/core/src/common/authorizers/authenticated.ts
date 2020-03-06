import { AuthChecker } from 'type-graphql';

import { GlobalContext } from '../types';

export const authChecker: AuthChecker<GlobalContext> = ({ context }): boolean => {
  return !!context.user;
};
