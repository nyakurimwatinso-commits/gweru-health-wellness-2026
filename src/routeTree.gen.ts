/* eslint-disable */
// @ts-nocheck
import { FileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as RootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => RootRoute,
} as any)

export const routeTree = RootRoute.addChildren([IndexRoute])

