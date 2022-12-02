import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { ArmService } from './arm.service';
import { Permissions, PermissionsAsRegExp } from '../models/arm/permission';

@Injectable()
export class RBACService {
  public readScope = './read';
  public writeScope = './write';
  public deleteScope = './delete';
  public actionScope = './action';

  private _wildCardEscapeSequence = '\\*';

  constructor(private _armService: ArmService) {}

  hasPermission(resourceId: string, requestedActions: string[]) {
    const authUrl = `${resourceId}/providers/microsoft.authorization/permissions`;
    return this._armService.getResource<any>(authUrl, '2015-07-01').pipe(
      map((result: any) => {
        return this._checkPermissions(
          resourceId,
          requestedActions,
          result.value
        );
      })
    );
  }

  private _getResourceType(resourceId: string) {
    const parts = resourceId.split('/').filter((part) => !!part);
    let resourceType = parts[5];
    for (let i = 6; i < parts.length; i += 2) {
      resourceType = resourceType + '/' + parts[i];
    }

    return resourceType;
  }

  private _checkPermissions(
    resourceId: string,
    requestedActions: string[],
    permissionsSet: Permissions[]
  ) {
    if (!requestedActions || !permissionsSet || permissionsSet.length === 0) {
      // If there are no requested actions or no available actions the caller has no permissions
      return false;
    }

    const resourceType = this._getResourceType(resourceId);
    const permissionSetRegexes = permissionsSet.map((permission) => {
      return this._permissionsToRegExp(permission);
    });

    return requestedActions.every((action) => {
      if (
        action.length > 1 &&
        action.charAt(0) === '.' &&
        action.charAt(1) === '/'
      ) {
        // Special case: turn leading ./ to {resourceType}/ for formatting.
        action = resourceType + action.substring(1);
      }

      return !!permissionSetRegexes.find((availableRegex) => {
        return this._isAllowed(action, availableRegex);
      });
    });
  }

  private _permissionsToRegExp(permissions: Permissions): PermissionsAsRegExp {
    const actions = permissions.actions.map((pattern) => {
      return this._convertWildCardPatternToRegex(pattern);
    });

    const notActions = permissions.notActions.map((pattern) => {
      return this._convertWildCardPatternToRegex(pattern);
    });

    return {
      actions: actions,
      notActions: notActions
    };
  }

  /*
   * 1. All allowed character escapes are taken into account: \*, \t, \n, \r, \\, \'
   *    a. \0 is explicitly not supported
   * 2. All non-escaped wildcards match 0 or more characters of anything
   * 3. The entire wildcard pattern is matched from beginning to end, and no more (e.g., a*d matches add but not adding or bad).
   * 4. The pattern matching should be case insensitive.
   */
  private _convertWildCardPatternToRegex(wildCardPattern: string): RegExp {
    wildCardPattern = wildCardPattern.replace(
      this._wildCardEscapeSequence,
      '\0'
    ); // sentinel for escaped wildcards
    const regex = this._escapeRegExp(wildCardPattern) // escape the rest of the regex
      .replace(this._wildCardEscapeSequence, '.*') // the previous command escaped legitimate wildcards - replace them with Regex wildcards
      .replace('\0', this._wildCardEscapeSequence) // replace sentinels with truly escaped wildcards
      .replace('\\t', '\t') // tabs
      .replace('\\n', '\n') // newlines
      .replace('\\r', '\r') // carriage returns
      .replace('\\\\', '\\') // backslashes
      .replace("\\'", "'"); // single quotes
    return new RegExp('^' + regex + '$', 'i'); // perform case insensitive compares
  }

  // Escape reserved regex characters so that they are not interpreted by regex evaluation.
  private _escapeRegExp(regex: string): string {
    return regex.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }

  private _isAllowed(
    requestedAction: string,
    permission: PermissionsAsRegExp
  ): boolean {
    const actionAllowed = !!permission.actions.find((action) =>
      action.test(requestedAction)
    );
    const actionDenied = !!permission.notActions.find((notAction) =>
      notAction.test(requestedAction)
    );

    return actionAllowed && !actionDenied;
  }
}
