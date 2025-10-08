import type { Resource } from 'i18next'
import agencies from './agencies'
import approvals from './approvals'
import assistant from './assistant'
import auth from './auth'
import backorders from './backorders'
import common from './common'
import dashboard from './dashboard'
import demo from './demo'
import forms from './forms'
import home from './home'
import inventory from './inventory'
import invoices from './invoices'
import navigation from './navigation'
import notifications from './notifications'
import payment from './payment'
import paymentsReceived from './paymentsReceived'
import pricing from './pricing'
import purchaseOrders from './purchaseOrders'
import roles from './roles'
import salesOrders from './salesOrders'
import sites from './sites'
import suppliers from './suppliers'
import teams from './teams'
import translation from './translation'
import workflowHistory from './workflow-history'
import workflowTemplates from './workflow-templates'
import workflows from './workflows'

export default {
  translation,
  dashboard,
  navigation,
  auth,
  common,
  inventory,
  teams,
  forms,
  notifications,
  payment,
  assistant,
  pricing,
  demo,
  backorders,
  salesOrders,
  invoices,
  paymentsReceived,
  suppliers,
  purchaseOrders,
  roles,
  agencies,
  sites,
  approvals,
  workflowHistory,
  workflowTemplates,
  workflows,
  home,
} satisfies Resource
