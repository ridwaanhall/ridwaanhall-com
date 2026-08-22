import { relations } from "drizzle-orm/relations";
import { aboutOrganization, aboutExperience, blogBlogpost, blogBlogimage, aboutProfile, aboutProfileskillhighlight, aboutSkill, aboutCertification, projectsProject, projectsProjectTechStack, aboutAward, djangoContentType, authPermission, projectsProjectimage, aboutApplication, aboutJourneystep, openhireHiringprofile, openhirePosition, authUser, guestbookUserprofile, authGroupPermissions, authGroup, projectsFeature, socialaccountSocialaccount, commentsComment, aboutDonatelink, socialaccountSocialtoken, socialaccountSocialapp, authUserGroups, openhireOpentoworkprofile, openhirePortfoliohighlight, legalLegaldocument, legalLegalsection, guestbookChatmessage, aboutEducation, accountEmailaddress, accountEmailconfirmation, djangoAdminLog, authUserUserPermissions } from "./schema";

export const aboutExperienceRelations = relations(aboutExperience, ({one}) => ({
	aboutOrganization: one(aboutOrganization, {
		fields: [aboutExperience.organizationId],
		references: [aboutOrganization.id]
	}),
}));

export const aboutOrganizationRelations = relations(aboutOrganization, ({many}) => ({
	aboutExperiences: many(aboutExperience),
	aboutCertifications: many(aboutCertification),
	aboutAwards: many(aboutAward),
	aboutEducations: many(aboutEducation),
}));

export const blogBlogimageRelations = relations(blogBlogimage, ({one}) => ({
	blogBlogpost: one(blogBlogpost, {
		fields: [blogBlogimage.blogId],
		references: [blogBlogpost.id]
	}),
}));

export const blogBlogpostRelations = relations(blogBlogpost, ({many}) => ({
	blogBlogimages: many(blogBlogimage),
}));

export const aboutProfileskillhighlightRelations = relations(aboutProfileskillhighlight, ({one}) => ({
	aboutProfile: one(aboutProfile, {
		fields: [aboutProfileskillhighlight.profileId],
		references: [aboutProfile.id]
	}),
	aboutSkill: one(aboutSkill, {
		fields: [aboutProfileskillhighlight.skillId],
		references: [aboutSkill.id]
	}),
}));

export const aboutProfileRelations = relations(aboutProfile, ({many}) => ({
	aboutProfileskillhighlights: many(aboutProfileskillhighlight),
	aboutDonatelinks: many(aboutDonatelink),
}));

export const aboutSkillRelations = relations(aboutSkill, ({many}) => ({
	aboutProfileskillhighlights: many(aboutProfileskillhighlight),
	projectsProjectTechStacks: many(projectsProjectTechStack),
}));

export const aboutCertificationRelations = relations(aboutCertification, ({one}) => ({
	aboutOrganization: one(aboutOrganization, {
		fields: [aboutCertification.organizationId],
		references: [aboutOrganization.id]
	}),
}));

export const projectsProjectTechStackRelations = relations(projectsProjectTechStack, ({one}) => ({
	projectsProject: one(projectsProject, {
		fields: [projectsProjectTechStack.projectId],
		references: [projectsProject.id]
	}),
	aboutSkill: one(aboutSkill, {
		fields: [projectsProjectTechStack.skillId],
		references: [aboutSkill.id]
	}),
}));

export const projectsProjectRelations = relations(projectsProject, ({many}) => ({
	projectsProjectTechStacks: many(projectsProjectTechStack),
	projectsProjectimages: many(projectsProjectimage),
	projectsFeatures: many(projectsFeature),
}));

export const aboutAwardRelations = relations(aboutAward, ({one}) => ({
	aboutOrganization: one(aboutOrganization, {
		fields: [aboutAward.organizationId],
		references: [aboutOrganization.id]
	}),
}));

export const authPermissionRelations = relations(authPermission, ({one, many}) => ({
	djangoContentType: one(djangoContentType, {
		fields: [authPermission.contentTypeId],
		references: [djangoContentType.id]
	}),
	authGroupPermissions: many(authGroupPermissions),
	authUserUserPermissions: many(authUserUserPermissions),
}));

export const djangoContentTypeRelations = relations(djangoContentType, ({many}) => ({
	authPermissions: many(authPermission),
	commentsComments: many(commentsComment),
	djangoAdminLogs: many(djangoAdminLog),
}));

export const projectsProjectimageRelations = relations(projectsProjectimage, ({one}) => ({
	projectsProject: one(projectsProject, {
		fields: [projectsProjectimage.projectId],
		references: [projectsProject.id]
	}),
}));

export const aboutJourneystepRelations = relations(aboutJourneystep, ({one}) => ({
	aboutApplication: one(aboutApplication, {
		fields: [aboutJourneystep.applicationId],
		references: [aboutApplication.id]
	}),
}));

export const aboutApplicationRelations = relations(aboutApplication, ({many}) => ({
	aboutJourneysteps: many(aboutJourneystep),
}));

export const openhirePositionRelations = relations(openhirePosition, ({one}) => ({
	openhireHiringprofile: one(openhireHiringprofile, {
		fields: [openhirePosition.hiringProfileId],
		references: [openhireHiringprofile.id]
	}),
}));

export const openhireHiringprofileRelations = relations(openhireHiringprofile, ({many}) => ({
	openhirePositions: many(openhirePosition),
}));

export const guestbookUserprofileRelations = relations(guestbookUserprofile, ({one}) => ({
	authUser: one(authUser, {
		fields: [guestbookUserprofile.userId],
		references: [authUser.id]
	}),
}));

export const authUserRelations = relations(authUser, ({many}) => ({
	guestbookUserprofiles: many(guestbookUserprofile),
	socialaccountSocialaccounts: many(socialaccountSocialaccount),
	commentsComments: many(commentsComment),
	authUserGroups: many(authUserGroups),
	guestbookChatmessages: many(guestbookChatmessage),
	accountEmailaddresses: many(accountEmailaddress),
	djangoAdminLogs: many(djangoAdminLog),
	authUserUserPermissions: many(authUserUserPermissions),
}));

export const authGroupPermissionsRelations = relations(authGroupPermissions, ({one}) => ({
	authPermission: one(authPermission, {
		fields: [authGroupPermissions.permissionId],
		references: [authPermission.id]
	}),
	authGroup: one(authGroup, {
		fields: [authGroupPermissions.groupId],
		references: [authGroup.id]
	}),
}));

export const authGroupRelations = relations(authGroup, ({many}) => ({
	authGroupPermissions: many(authGroupPermissions),
	authUserGroups: many(authUserGroups),
}));

export const projectsFeatureRelations = relations(projectsFeature, ({one}) => ({
	projectsProject: one(projectsProject, {
		fields: [projectsFeature.projectId],
		references: [projectsProject.id]
	}),
}));

export const socialaccountSocialaccountRelations = relations(socialaccountSocialaccount, ({one, many}) => ({
	authUser: one(authUser, {
		fields: [socialaccountSocialaccount.userId],
		references: [authUser.id]
	}),
	socialaccountSocialtokens: many(socialaccountSocialtoken),
}));

export const commentsCommentRelations = relations(commentsComment, ({one, many}) => ({
	djangoContentType: one(djangoContentType, {
		fields: [commentsComment.contentTypeId],
		references: [djangoContentType.id]
	}),
	commentsComment: one(commentsComment, {
		fields: [commentsComment.replyToId],
		references: [commentsComment.id],
		relationName: "commentsComment_replyToId_commentsComment_id"
	}),
	commentsComments: many(commentsComment, {
		relationName: "commentsComment_replyToId_commentsComment_id"
	}),
	authUser: one(authUser, {
		fields: [commentsComment.userId],
		references: [authUser.id]
	}),
}));

export const aboutDonatelinkRelations = relations(aboutDonatelink, ({one}) => ({
	aboutProfile: one(aboutProfile, {
		fields: [aboutDonatelink.profileId],
		references: [aboutProfile.id]
	}),
}));

export const socialaccountSocialtokenRelations = relations(socialaccountSocialtoken, ({one}) => ({
	socialaccountSocialaccount: one(socialaccountSocialaccount, {
		fields: [socialaccountSocialtoken.accountId],
		references: [socialaccountSocialaccount.id]
	}),
	socialaccountSocialapp: one(socialaccountSocialapp, {
		fields: [socialaccountSocialtoken.appId],
		references: [socialaccountSocialapp.id]
	}),
}));

export const socialaccountSocialappRelations = relations(socialaccountSocialapp, ({many}) => ({
	socialaccountSocialtokens: many(socialaccountSocialtoken),
}));

export const authUserGroupsRelations = relations(authUserGroups, ({one}) => ({
	authGroup: one(authGroup, {
		fields: [authUserGroups.groupId],
		references: [authGroup.id]
	}),
	authUser: one(authUser, {
		fields: [authUserGroups.userId],
		references: [authUser.id]
	}),
}));

export const openhirePortfoliohighlightRelations = relations(openhirePortfoliohighlight, ({one}) => ({
	openhireOpentoworkprofile: one(openhireOpentoworkprofile, {
		fields: [openhirePortfoliohighlight.openToWorkProfileId],
		references: [openhireOpentoworkprofile.id]
	}),
}));

export const openhireOpentoworkprofileRelations = relations(openhireOpentoworkprofile, ({many}) => ({
	openhirePortfoliohighlights: many(openhirePortfoliohighlight),
}));

export const legalLegalsectionRelations = relations(legalLegalsection, ({one, many}) => ({
	legalLegaldocument: one(legalLegaldocument, {
		fields: [legalLegalsection.documentId],
		references: [legalLegaldocument.id]
	}),
	legalLegalsection: one(legalLegalsection, {
		fields: [legalLegalsection.parentId],
		references: [legalLegalsection.id],
		relationName: "legalLegalsection_parentId_legalLegalsection_id"
	}),
	legalLegalsections: many(legalLegalsection, {
		relationName: "legalLegalsection_parentId_legalLegalsection_id"
	}),
}));

export const legalLegaldocumentRelations = relations(legalLegaldocument, ({many}) => ({
	legalLegalsections: many(legalLegalsection),
}));

export const guestbookChatmessageRelations = relations(guestbookChatmessage, ({one, many}) => ({
	guestbookChatmessage: one(guestbookChatmessage, {
		fields: [guestbookChatmessage.replyToId],
		references: [guestbookChatmessage.id],
		relationName: "guestbookChatmessage_replyToId_guestbookChatmessage_id"
	}),
	guestbookChatmessages: many(guestbookChatmessage, {
		relationName: "guestbookChatmessage_replyToId_guestbookChatmessage_id"
	}),
	authUser: one(authUser, {
		fields: [guestbookChatmessage.userId],
		references: [authUser.id]
	}),
}));

export const aboutEducationRelations = relations(aboutEducation, ({one}) => ({
	aboutOrganization: one(aboutOrganization, {
		fields: [aboutEducation.organizationId],
		references: [aboutOrganization.id]
	}),
}));

export const accountEmailconfirmationRelations = relations(accountEmailconfirmation, ({one}) => ({
	accountEmailaddress: one(accountEmailaddress, {
		fields: [accountEmailconfirmation.emailAddressId],
		references: [accountEmailaddress.id]
	}),
}));

export const accountEmailaddressRelations = relations(accountEmailaddress, ({one, many}) => ({
	accountEmailconfirmations: many(accountEmailconfirmation),
	authUser: one(authUser, {
		fields: [accountEmailaddress.userId],
		references: [authUser.id]
	}),
}));

export const djangoAdminLogRelations = relations(djangoAdminLog, ({one}) => ({
	djangoContentType: one(djangoContentType, {
		fields: [djangoAdminLog.contentTypeId],
		references: [djangoContentType.id]
	}),
	authUser: one(authUser, {
		fields: [djangoAdminLog.userId],
		references: [authUser.id]
	}),
}));

export const authUserUserPermissionsRelations = relations(authUserUserPermissions, ({one}) => ({
	authPermission: one(authPermission, {
		fields: [authUserUserPermissions.permissionId],
		references: [authPermission.id]
	}),
	authUser: one(authUser, {
		fields: [authUserUserPermissions.userId],
		references: [authUser.id]
	}),
}));