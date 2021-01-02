import { defineComponent } from 'vue';
import { usePromise } from 'vue-composable';

import { fetchAllSchemas } from '~/common/api';
import { useCan } from '~/hooks/useCan';
import { useConfig } from '~/hooks/useConfig';

export const SideMenu = defineComponent(() => {
  const config = useConfig();
  const can = useCan();

  const schemaPromise = usePromise(() => fetchAllSchemas());

  const getSingletonMenuItem = (): JSX.Element | null => {
    if (can('internal:schema:read')) {
      return (
        <el-menu-item>
          <i class="el-icon-house" />
          <router-link to="/singletons">Singletons</router-link>
        </el-menu-item>
      );
    }

    return null;
  };

  const getSchemaMenuItem = (): JSX.Element | null => {
    if (can('internal:schema:read')) {
      return (
        <el-submenu>
          {{
            title: () => (
              <>
                <i class="el-icon-s-grid" />
                Schemas
              </>
            ),
            default: () => {
              if (schemaPromise.loading.value) {
                return (
                  <el-menu-item-group>
                    <el-menu-item>
                      Fetching Schemas <i class="el-icon-loading" />
                    </el-menu-item>
                  </el-menu-item-group>
                );
              }

              if (schemaPromise.result.value === null || schemaPromise.error.value) {
                return (
                  <div>
                    Error occurred whilst fetching Schemas{' '}
                    <a class="font-bold" onClick={schemaPromise.exec}>
                      Retry?
                    </a>
                    ...
                  </div>
                );
              }

              return (
                <el-menu-item-group>
                  {schemaPromise.result.value.map(schema => (
                    <el-menu-item>
                      <i class="el-icon-invalid"></i>
                      <router-link to={`/schemas/${schema.id}`}>{schema.title}</router-link>
                    </el-menu-item>
                  ))}

                  <el-menu-item class="font-semibold">
                    <i class="el-icon-setting" />
                    <router-link to="/schemas">Management</router-link>
                  </el-menu-item>
                </el-menu-item-group>
              );
            },
          }}
        </el-submenu>
      );
    }

    return null;
  };

  const getDocumentMenuItem = (): JSX.Element | null => {
    if (can('internal:document:read')) {
      return (
        <el-menu-item>
          <i class="el-icon-document" />
          <router-link to="/documents">Documents</router-link>
        </el-menu-item>
      );
    }

    return (
      <el-submenu>
        {{
          title: () => (
            <>
              <i class="el-icon-document" />
              Documents
            </>
          ),
          default: () => {
            if (schemaPromise.loading.value) {
              return (
                <el-menu-item-group>
                  <el-menu-item>
                    Fetching Schemas <i class="el-icon-loading" />
                  </el-menu-item>
                </el-menu-item-group>
              );
            }

            if (schemaPromise.result.value === null || schemaPromise.error.value) {
              return (
                <div>
                  Error occurred whilst fetching Schemas{' '}
                  <a class="font-bold" onClick={schemaPromise.exec}>
                    Retry?
                  </a>
                  ...
                </div>
              );
            }

            return (
              <el-menu-item-group>
                {schemaPromise.result.value.map(schema => (
                  <el-menu-item>
                    <router-link to={`/schemas/${schema.id}`}>{schema.title}</router-link>
                  </el-menu-item>
                ))}
              </el-menu-item-group>
            );
          },
        }}
      </el-submenu>
    );
  };

  return () => (
    <el-menu
      background-color={config.ui.backgroundColor}
      text-color={config.ui.textColor}
      active-text-color={config.ui.activeTextColour}
      style="height: 100vh;"
    >
      <el-menu-item>
        <i class="el-icon-s-home" />
        <router-link to="/">Home</router-link>
      </el-menu-item>

      {getDocumentMenuItem()}

      {getSchemaMenuItem()}

      {getSingletonMenuItem()}
    </el-menu>
  );
});

export default SideMenu;
