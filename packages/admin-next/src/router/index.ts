import { createRouter, createWebHashHistory } from 'vue-router';

export const Router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import(/* webpackChunkName: "home" */ '../pages/Home'),
      meta: { layout: 'Dashboard' },
    },
    {
      path: '/login',
      component: () => import(/* webpackChunkName: "login" */ '../pages/Login'),
      meta: { layout: 'Guest' },
    },
    {
      path: '/documents',
      component: () => import(/* webpackChunkName: "documents" */ '../pages/Documents'),
      meta: { layout: 'Dashboard' },
    },
    {
      path: '/schemas/:schemaId',
      component: () => import(/* webpackChunkName: "schemas" */ '../pages/Schemas/_Id'),
      meta: { layout: 'Dashboard' },
    },
    {
      path: '/403',
      component: () => import(/* webpackChunkName: "403" */ '../pages/403'),
      meta: { layout: 'Dashboard' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import(/* webpackChunkName: "404" */ '../pages/404'),
      meta: { layout: 'Dashboard' },
    },
  ],
});

export default Router;
