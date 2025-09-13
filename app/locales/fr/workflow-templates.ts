export default {
    // Page titles and descriptions
    title: "Modèles de Workflow",
    subtitle: "Gérez les modèles de workflow pour l'automatisation des processus",
    description: "Créez et gérez des modèles de workflow d'approbation réutilisables",

    // Messages
    messages: {
        created: "créé",
        updated: "mis à jour",
        cloned: "cloné",
        processed: "traité",
        templateActionSuccess: "Modèle {{action}} avec succès !",
        actionFailed: "Échec du traitement de l'action du modèle. Veuillez réessayer.",
        confirmDelete: "Êtes-vous sûr de vouloir supprimer ce modèle de workflow ?",
        templateDeleted: "Modèle supprimé avec succès !",
        deleteFailed: "Échec de la suppression du modèle. Veuillez réessayer.",
        statusUpdated: "Statut du modèle mis à jour avec succès !",
        statusUpdateFailed: "Échec de la mise à jour du statut du modèle. Veuillez réessayer.",
        noTemplates: "Aucun Modèle de Workflow",
        noTemplatesDescription: "Créez votre premier modèle de workflow pour rationaliser les processus d'approbation.",
        noMatchingTemplates: "Aucun modèle ne correspond aux filtres actuels. Essayez d'ajuster vos critères de recherche."
    },

    // Actions
    actions: {
        createTemplate: "Créer un Modèle",
        createFirstTemplate: "Créer le Premier Modèle",
        editTemplate: "Modifier le Modèle",
        cloneTemplate: "Cloner le Modèle",
        deleteTemplate: "Supprimer le Modèle",
        activate: "Activer",
        deactivate: "Désactiver",
        addStep: "Ajouter une Étape",
        removeStep: "Supprimer l'Étape",
        moveUp: "Déplacer vers le Haut",
        moveDown: "Déplacer vers le Bas",
        save: "Enregistrer",
        cancel: "Annuler"
    },

    // Summary/Statistics
    summary: {
        totalTemplates: "Total des Modèles",
        activeTemplates: "Modèles Actifs",
        inactiveTemplates: "Modèles Inactifs",
        totalUsage: "Utilisation Totale"
    },

    // Filters
    filters: {
        title: "Filtrer les Modèles",
        clearFilters: "Effacer les Filtres",
        searchTemplates: "Rechercher des modèles...",
        filterByTrigger: "Filtrer par type de déclencheur",
        filterByStatus: "Filtrer par statut"
    },

    // Statuses
    statuses: {
        active: "Actif",
        inactive: "Inactif",
        draft: "Brouillon",
        published: "Publié"
    },

    // Template details
    template: {
        workflowSteps: "Étapes du Workflow",
        moreSteps: "étapes supplémentaires",
        createdBy: "Créé par",
        usageCount: "Fois utilisé",
        lastUpdated: "Dernière mise à jour"
    },

    // Modal
    modal: {
        createTemplate: "Créer un Modèle de Workflow",
        editTemplate: "Modifier le Modèle de Workflow",
        cloneTemplate: "Cloner le Modèle de Workflow",
        workflowTemplate: "Modèle de Workflow",
        basicInformation: "Informations de Base",
        workflowSteps: "Étapes du Workflow",
        stepDetails: "Détails de l'Étape",
        addFirstStep: "Ajouter la Première Étape",
        addAnotherStep: "Ajouter une Autre Étape"
    },

    // Form fields
    fields: {
        templateName: "Nom du Modèle",
        description: "Description",
        entityType: "Type d'Entité",
        triggerType: "Type de Déclencheur",
        priority: "Priorité",
        stepName: "Nom de l'Étape",
        stepDescription: "Description de l'Étape",
        stepType: "Type d'Étape",
        assigneeType: "Type d'Assigné",
        assignToUser: "Assigner à l'Utilisateur",
        assignToRole: "Assigner au Rôle",
        selectUser: "Sélectionner un Utilisateur",
        selectRole: "Sélectionner un Rôle",
        timeoutDays: "Délai d'Expiration (Jours)",
        makeOptional: "Rendre Optionnel",
        isRequired: "Est Requis"
    },

    // Placeholders
    placeholders: {
        templateName: "Entrez le nom du modèle...",
        description: "Entrez la description du modèle...",
        entityType: "Sélectionnez le type d'entité...",
        triggerType: "Sélectionnez le type de déclencheur...",
        stepName: "Entrez le nom de l'étape...",
        stepDescription: "Entrez la description de l'étape...",
        selectUser: "Sélectionnez un utilisateur...",
        selectRole: "Sélectionnez un rôle..."
    },

    // Validation
    validation: {
        nameRequired: "Le nom du modèle est requis",
        descriptionRequired: "La description du modèle est requise",
        entityTypeRequired: "Le type d'entité est requis",
        triggerTypeRequired: "Le type de déclencheur est requis",
        stepsRequired: "Au moins une étape de workflow est requise",
        stepNameRequired: "Toutes les étapes doivent avoir un nom",
        stepAssigneeRequired: "Toutes les étapes doivent avoir un assigné",
        assigneeRequired: "L'assigné est requis"
    },

    // Entity Types (for backward compatibility)
    entityTypes: {
        purchase_order: "Bon de Commande",
        stock_adjustment: "Ajustement de Stock",
        customer: "Client",
        transfer_order: "Ordre de Transfert",
        sales_order: "Commande de Vente",
        invoice: "Facture",
        bill: "Facture Fournisseur",
        supplier: "Fournisseur",
        product: "Produit"
    },

    // Priorities (for backward compatibility)
    priorities: {
        critical: "Critique",
        high: "Élevée",
        medium: "Moyenne",
        low: "Faible"
    },

    // Step Types
    stepTypes: {
        approval: "Approbation",
        notification: "Notification",
        review: "Révision",
        data_validation: "Validation des Données",
        automatic_action: "Action Automatique",
        conditional_logic: "Logique Conditionnelle",
        parallel_approval: "Approbation Parallèle",
        sequential_approval: "Approbation Séquentielle",
        escalation: "Escalade",
        integration: "Intégration"
    },

    // Assignee Types
    assigneeTypes: {
        user: "Utilisateur",
        role: "Rôle",
        creator: "Créateur",
        manager: "Manager",
        department_head: "Chef de Département"
    },

    // Trigger Types
    triggerTypes: {
        manual: "Manuel",
        purchase_order_create: "Création de Bon de Commande",
        purchase_order_threshold: "Seuil de Bon de Commande",
        sales_order_create: "Création de Commande de Vente",
        sales_order_threshold: "Seuil de Commande de Vente",
        stock_adjustment_create: "Création d'Ajustement de Stock",
        transfer_order_create: "Création d'Ordre de Transfert",
        invoice_create: "Création de Facture",
        bill_create: "Création de Facture Fournisseur",
        customer_create: "Création de Client",
        supplier_create: "Création de Fournisseur",
        product_create: "Création de Produit",
        low_stock_alert: "Alerte de Stock Faible",
        high_value_transaction: "Transaction de Valeur Élevée",
        bulk_operation: "Opération en Lot",
        scheduled: "Programmé",
        custom_condition: "Condition Personnalisée"
    },

    // Common terms
    workflow: "Workflow",
    workflows: "Workflows",
    process: "Processus",
    processes: "Processus",
    automation: "Automatisation",
    approval: "Approbation",
    approvals: "Approbations",
    steps: "Étapes",
    step: "Étape"
}