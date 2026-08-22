import { pgTable, index, unique, bigint, varchar, text, foreignKey, check, boolean, jsonb, integer, date, timestamp, uniqueIndex, smallint } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const aboutSkill = pgTable("about_skill", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "about_skill_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text().notNull(),
	iconSvg: varchar("icon_svg", { length: 500 }).notNull(),
	category: varchar({ length: 100 }).notNull(),
}, (table) => [
	index("about_skill_slug_2bd8fd89_like").using("btree", table.slug.asc().nullsLast().op("varchar_pattern_ops")),
	unique("about_skill_slug_key").on(table.slug),
]);

export const aboutExperience = pgTable("about_experience", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "about_experience_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	title: varchar({ length: 255 }).notNull(),
	employmentType: varchar("employment_type", { length: 50 }).notNull(),
	locationType: varchar("location_type", { length: 50 }).notNull(),
	location: varchar({ length: 255 }).notNull(),
	isCurrent: boolean("is_current").notNull(),
	responsibilities: jsonb().notNull(),
	sortOrder: integer("sort_order").notNull(),
	periodStart: date("period_start").notNull(),
	periodEnd: date("period_end"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
}, (table) => [
	index("about_experience_organization_id_eebde7d9").using("btree", table.organizationId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [aboutOrganization.id],
			name: "about_experience_organization_id_eebde7d9_fk_about_org"
		}),
	check("about_experience_sort_order_check", sql`sort_order >= 0`),
]);

export const blogBlogimage = pgTable("blog_blogimage", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "blog_blogimage_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	image: varchar({ length: 100 }).notNull(),
	originalFilename: varchar("original_filename", { length: 255 }).notNull(),
	order: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	blogId: bigint("blog_id", { mode: "number" }).notNull(),
}, (table) => [
	index("blog_blogimage_blog_id_17a42bec").using("btree", table.blogId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.blogId],
			foreignColumns: [blogBlogpost.id],
			name: "blog_blogimage_blog_id_17a42bec_fk_blog_blogpost_id"
		}),
	check("blog_blogimage_order_check", sql`"order" >= 0`),
]);

export const projectsProject = pgTable("projects_project", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "projects_project_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	headline: varchar({ length: 500 }).notNull(),
	/**
	 * The rich-text description, as HTML. Replaced a JSONB block array for the
	 * same reason as blog_blogpost.content_html -- see the note there.
	 */
	descriptionHtml: text("description_html").default("").notNull(),
	githubUrl: varchar("github_url", { length: 200 }),
	demoUrl: varchar("demo_url", { length: 200 }),
	category: varchar({ length: 255 }).notNull(),
	tags: jsonb().notNull(),
	isFeatured: boolean("is_featured").notNull(),
	featuredPriority: integer("featured_priority"),
	status: varchar({ length: 32 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("projects_pr_is_feat_bfabaf_idx").using("btree", table.isFeatured.asc().nullsLast().op("bool_ops")),
	index("projects_pr_status_f023cb_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("projects_project_slug_2d50067a_like").using("btree", table.slug.asc().nullsLast().op("varchar_pattern_ops")),
	unique("projects_project_slug_key").on(table.slug),
]);

export const socialaccountSocialapp = pgTable("socialaccount_socialapp", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "socialaccount_socialapp_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	provider: varchar({ length: 30 }).notNull(),
	name: varchar({ length: 40 }).notNull(),
	clientId: varchar("client_id", { length: 191 }).notNull(),
	secret: varchar({ length: 191 }).notNull(),
	key: varchar({ length: 191 }).notNull(),
	providerId: varchar("provider_id", { length: 200 }).notNull(),
	settings: jsonb().notNull(),
});

export const aboutProfileskillhighlight = pgTable("about_profileskillhighlight", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "about_profileskillhighlight_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	order: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	profileId: bigint("profile_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	skillId: bigint("skill_id", { mode: "number" }).notNull(),
}, (table) => [
	index("about_profileskillhighlight_profile_id_33f83da8").using("btree", table.profileId.asc().nullsLast().op("int8_ops")),
	index("about_profileskillhighlight_skill_id_c59b70a2").using("btree", table.skillId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [aboutProfile.id],
			name: "about_profileskillhi_profile_id_33f83da8_fk_about_pro"
		}),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [aboutSkill.id],
			name: "about_profileskillhighlight_skill_id_c59b70a2_fk_about_skill_id"
		}),
	unique("unique_profile_skill_highlight").on(table.profileId, table.skillId),
	check("about_profileskillhighlight_order_check", sql`"order" >= 0`),
]);

export const aboutCertification = pgTable("about_certification", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "about_certification_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	title: varchar({ length: 255 }).notNull(),
	credentialUrl: varchar("credential_url", { length: 200 }).notNull(),
	isFeatured: boolean("is_featured").notNull(),
	achievements: jsonb().notNull(),
	issued: date().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
}, (table) => [
	index("about_certification_organization_id_be11db2d").using("btree", table.organizationId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [aboutOrganization.id],
			name: "about_certification_organization_id_be11db2d_fk_about_org"
		}),
]);

export const projectsProjectTechStack = pgTable("projects_project_tech_stack", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "projects_project_tech_stack_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	skillId: bigint("skill_id", { mode: "number" }).notNull(),
}, (table) => [
	index("projects_project_tech_stack_project_id_57f369fa").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("projects_project_tech_stack_skill_id_a059433c").using("btree", table.skillId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsProject.id],
			name: "projects_project_tec_project_id_57f369fa_fk_projects_"
		}),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [aboutSkill.id],
			name: "projects_project_tech_stack_skill_id_a059433c_fk_about_skill_id"
		}),
	unique("projects_project_tech_stack_project_id_skill_id_5501e506_uniq").on(table.projectId, table.skillId),
]);

export const djangoMigrations = pgTable("django_migrations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "django_migrations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	app: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	applied: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const aboutAward = pgTable("about_award", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "about_award_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	title: varchar({ length: 255 }).notNull(),
	credentialUrl: varchar("credential_url", { length: 200 }).notNull(),
	description: text().notNull(),
	issued: date().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
}, (table) => [
	index("about_award_organization_id_7ae2b5b6").using("btree", table.organizationId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [aboutOrganization.id],
			name: "about_award_organization_id_7ae2b5b6_fk_about_organization_id"
		}),
]);

export const aboutApplication = pgTable("about_application", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "about_application_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	status: varchar({ length: 20 }).notNull(),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	position: varchar({ length: 255 }).notNull(),
	employmentType: varchar("employment_type", { length: 20 }).notNull(),
	locationType: varchar("location_type", { length: 20 }).notNull(),
	location: varchar({ length: 255 }).notNull(),
	appliedVia: varchar("applied_via", { length: 20 }),
	salaryRange: varchar("salary_range", { length: 100 }),
	lessonsLearned: text("lessons_learned").notNull(),
});

export const authPermission = pgTable("auth_permission", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "auth_permission_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 255 }).notNull(),
	contentTypeId: integer("content_type_id").notNull(),
	codename: varchar({ length: 100 }).notNull(),
}, (table) => [
	index("auth_permission_content_type_id_2f476e4b").using("btree", table.contentTypeId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.contentTypeId],
			foreignColumns: [djangoContentType.id],
			name: "auth_permission_content_type_id_2f476e4b_fk_django_co"
		}),
	unique("auth_permission_content_type_id_codename_01ab375a_uniq").on(table.contentTypeId, table.codename),
]);

export const projectsProjectimage = pgTable("projects_projectimage", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "projects_projectimage_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	image: varchar({ length: 100 }).notNull(),
	originalFilename: varchar("original_filename", { length: 255 }).notNull(),
	order: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
}, (table) => [
	index("projects_projectimage_project_id_618ded0e").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsProject.id],
			name: "projects_projectimag_project_id_618ded0e_fk_projects_"
		}),
	check("projects_projectimage_order_check", sql`"order" >= 0`),
]);

export const aboutJourneystep = pgTable("about_journeystep", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "about_journeystep_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }),
	title: varchar({ length: 255 }).notNull(),
	details: text().notNull(),
	notes: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	applicationId: bigint("application_id", { mode: "number" }).notNull(),
}, (table) => [
	index("about_journeystep_application_id_a2cb78d9").using("btree", table.applicationId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [aboutApplication.id],
			name: "about_journeystep_application_id_a2cb78d9_fk_about_app"
		}),
]);

export const openhirePosition = pgTable("openhire_position", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "openhire_position_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	title: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 100 }).notNull(),
	location: varchar({ length: 255 }).notNull(),
	salaryRange: varchar("salary_range", { length: 100 }).notNull(),
	experienceRequired: varchar("experience_required", { length: 255 }).notNull(),
	skillsRequired: jsonb("skills_required").notNull(),
	responsibilities: jsonb().notNull(),
	benefits: jsonb().notNull(),
	order: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	hiringProfileId: bigint("hiring_profile_id", { mode: "number" }).notNull(),
}, (table) => [
	index("openhire_position_hiring_profile_id_0b8b2dc4").using("btree", table.hiringProfileId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.hiringProfileId],
			foreignColumns: [openhireHiringprofile.id],
			name: "openhire_position_hiring_profile_id_0b8b2dc4_fk_openhire_"
		}),
	check("openhire_position_order_check", sql`"order" >= 0`),
]);

export const guestbookUserprofile = pgTable("guestbook_userprofile", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "guestbook_userprofile_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	isAuthor: boolean("is_author").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	userId: integer("user_id").notNull(),
	coAuthorOrder: integer("co_author_order").notNull(),
	isCoAuthor: boolean("is_co_author").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [authUser.id],
			name: "guestbook_userprofile_user_id_f1e46e02_fk_auth_user_id"
		}),
	unique("guestbook_userprofile_user_id_key").on(table.userId),
	check("guestbook_userprofile_co_author_order_check", sql`co_author_order >= 0`),
]);

export const authGroupPermissions = pgTable("auth_group_permissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "auth_group_permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	groupId: integer("group_id").notNull(),
	permissionId: integer("permission_id").notNull(),
}, (table) => [
	index("auth_group_permissions_group_id_b120cbf9").using("btree", table.groupId.asc().nullsLast().op("int4_ops")),
	index("auth_group_permissions_permission_id_84c5c92e").using("btree", table.permissionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [authPermission.id],
			name: "auth_group_permissio_permission_id_84c5c92e_fk_auth_perm"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [authGroup.id],
			name: "auth_group_permissions_group_id_b120cbf9_fk_auth_group_id"
		}),
	unique("auth_group_permissions_group_id_permission_id_0cd325b0_uniq").on(table.groupId, table.permissionId),
]);

export const projectsFeature = pgTable("projects_feature", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "projects_feature_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	order: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
}, (table) => [
	index("projects_feature_project_id_4b1ac255").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projectsProject.id],
			name: "projects_feature_project_id_4b1ac255_fk_projects_project_id"
		}),
	check("projects_feature_order_check", sql`"order" >= 0`),
]);

export const socialaccountSocialaccount = pgTable("socialaccount_socialaccount", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "socialaccount_socialaccount_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	provider: varchar({ length: 200 }).notNull(),
	uid: varchar({ length: 191 }).notNull(),
	lastLogin: timestamp("last_login", { withTimezone: true, mode: 'string' }).notNull(),
	dateJoined: timestamp("date_joined", { withTimezone: true, mode: 'string' }).notNull(),
	extraData: jsonb("extra_data").notNull(),
	userId: integer("user_id").notNull(),
}, (table) => [
	index("socialaccount_socialaccount_user_id_8146e70c").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [authUser.id],
			name: "socialaccount_socialaccount_user_id_8146e70c_fk_auth_user_id"
		}),
	unique("socialaccount_socialaccount_provider_uid_fc810c6e_uniq").on(table.provider, table.uid),
]);

export const aboutProfile = pgTable("about_profile", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "about_profile_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	name: varchar({ length: 255 }).notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	username: varchar({ length: 100 }).notNull(),
	aka: varchar({ length: 100 }).notNull(),
	image: varchar({ length: 100 }),
	personalWebsite: varchar("personal_website", { length: 200 }).notNull(),
	cvMain: varchar("cv_main", { length: 200 }).notNull(),
	cvLatest: varchar("cv_latest", { length: 200 }).notNull(),
	cvCopy: varchar("cv_copy", { length: 200 }).notNull(),
	role: varchar({ length: 255 }).notNull(),
	isOpenToWork: boolean("is_open_to_work").notNull(),
	isHiring: boolean("is_hiring").notNull(),
	isSick: boolean("is_sick").notNull(),
	shortDescription: text("short_description").notNull(),
	shortBio: text("short_bio").notNull(),
	shortCta: text("short_cta").notNull(),
	longDescription: text("long_description").notNull(),
	stories: jsonb().notNull(),
	locationRegency: varchar("location_regency", { length: 100 }).notNull(),
	locationResidency: varchar("location_residency", { length: 100 }).notNull(),
	locationProvince: varchar("location_province", { length: 100 }).notNull(),
	locationProv: varchar("location_prov", { length: 100 }).notNull(),
	locationCountry: varchar("location_country", { length: 100 }).notNull(),
	locationFlag: varchar("location_flag", { length: 16 }).notNull(),
	socialEmail: varchar("social_email", { length: 254 }).notNull(),
	socialGithub: varchar("social_github", { length: 200 }).notNull(),
	socialLinkedin: varchar("social_linkedin", { length: 200 }).notNull(),
	socialFollowLinkedin: varchar("social_follow_linkedin", { length: 200 }).notNull(),
	socialInstagram: varchar("social_instagram", { length: 200 }).notNull(),
	socialMedium: varchar("social_medium", { length: 200 }).notNull(),
	socialX: varchar("social_x", { length: 200 }).notNull(),
	socialWebsite: varchar("social_website", { length: 200 }).notNull(),
});

export const commentsComment = pgTable("comments_comment", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "comments_comment_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	objectId: integer("object_id").notNull(),
	body: text().notNull(),
	isDeleted: boolean("is_deleted").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	contentTypeId: integer("content_type_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	replyToId: bigint("reply_to_id", { mode: "number" }),
	userId: integer("user_id").notNull(),
}, (table) => [
	index("comments_co_content_7dda54_idx").using("btree", table.contentTypeId.asc().nullsLast().op("int4_ops"), table.objectId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("comments_comment_content_type_id_72fd5dbe").using("btree", table.contentTypeId.asc().nullsLast().op("int4_ops")),
	index("comments_comment_created_at_c684ddb5").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("comments_comment_reply_to_id_c5c704af").using("btree", table.replyToId.asc().nullsLast().op("int8_ops")),
	index("comments_comment_user_id_a1db4881").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.contentTypeId],
			foreignColumns: [djangoContentType.id],
			name: "comments_comment_content_type_id_72fd5dbe_fk_django_co"
		}),
	foreignKey({
			columns: [table.replyToId],
			foreignColumns: [table.id],
			name: "comments_comment_reply_to_id_c5c704af_fk_comments_comment_id"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [authUser.id],
			name: "comments_comment_user_id_a1db4881_fk_auth_user_id"
		}),
	check("comments_comment_object_id_check", sql`object_id >= 0`),
]);

export const openhireOpentoworkprofile = pgTable("openhire_opentoworkprofile", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "openhire_opentoworkprofile_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	status: varchar({ length: 100 }).notNull(),
	availability: varchar({ length: 100 }).notNull(),
	remote: boolean().notNull(),
	relocation: boolean().notNull(),
	showAllToolsSkills: boolean("show_all_tools_skills").notNull(),
	type: jsonb().notNull(),
	preferredRoles: jsonb("preferred_roles").notNull(),
	skillsHighlight: jsonb("skills_highlight").notNull(),
	languages: jsonb().notNull(),
	preferredLocations: jsonb("preferred_locations").notNull(),
	locationTypes: jsonb("location_types").notNull(),
	remoteLocations: jsonb("remote_locations").notNull(),
	experienceLevel: varchar("experience_level", { length: 100 }).notNull(),
	salaryExpectation: varchar("salary_expectation", { length: 100 }).notNull(),
	noticePeriod: varchar("notice_period", { length: 100 }).notNull(),
	workAuthorization: varchar("work_authorization", { length: 100 }).notNull(),
	contactPreference: varchar("contact_preference", { length: 100 }).notNull(),
	interviewAvailability: varchar("interview_availability", { length: 255 }).notNull(),
	additionalNotes: text("additional_notes").notNull(),
});

export const djangoSession = pgTable("django_session", {
	sessionKey: varchar("session_key", { length: 40 }).primaryKey().notNull(),
	sessionData: text("session_data").notNull(),
	expireDate: timestamp("expire_date", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("django_session_expire_date_a5c62663").using("btree", table.expireDate.asc().nullsLast().op("timestamptz_ops")),
	index("django_session_session_key_c0390e0f_like").using("btree", table.sessionKey.asc().nullsLast().op("varchar_pattern_ops")),
]);

export const aboutDonatelink = pgTable("about_donatelink", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "about_donatelink_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	platform: varchar({ length: 100 }).notNull(),
	url: varchar({ length: 200 }).notNull(),
	order: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	profileId: bigint("profile_id", { mode: "number" }).notNull(),
}, (table) => [
	index("about_donatelink_profile_id_5bbaaa5e").using("btree", table.profileId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [aboutProfile.id],
			name: "about_donatelink_profile_id_5bbaaa5e_fk_about_profile_id"
		}),
	check("about_donatelink_order_check", sql`"order" >= 0`),
]);

export const authGroup = pgTable("auth_group", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "auth_group_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 150 }).notNull(),
}, (table) => [
	index("auth_group_name_a6ea08ec_like").using("btree", table.name.asc().nullsLast().op("varchar_pattern_ops")),
	unique("auth_group_name_key").on(table.name),
]);

export const socialaccountSocialtoken = pgTable("socialaccount_socialtoken", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "socialaccount_socialtoken_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	token: text().notNull(),
	tokenSecret: text("token_secret").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	accountId: integer("account_id").notNull(),
	appId: integer("app_id"),
}, (table) => [
	index("socialaccount_socialtoken_account_id_951f210e").using("btree", table.accountId.asc().nullsLast().op("int4_ops")),
	index("socialaccount_socialtoken_app_id_636a42d7").using("btree", table.appId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [socialaccountSocialaccount.id],
			name: "socialaccount_social_account_id_951f210e_fk_socialacc"
		}),
	foreignKey({
			columns: [table.appId],
			foreignColumns: [socialaccountSocialapp.id],
			name: "socialaccount_social_app_id_636a42d7_fk_socialacc"
		}),
	unique("socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq").on(table.accountId, table.appId),
]);

export const authUserGroups = pgTable("auth_user_groups", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "auth_user_groups_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: integer("user_id").notNull(),
	groupId: integer("group_id").notNull(),
}, (table) => [
	index("auth_user_groups_group_id_97559544").using("btree", table.groupId.asc().nullsLast().op("int4_ops")),
	index("auth_user_groups_user_id_6a12ed8b").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [authGroup.id],
			name: "auth_user_groups_group_id_97559544_fk_auth_group_id"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [authUser.id],
			name: "auth_user_groups_user_id_6a12ed8b_fk_auth_user_id"
		}),
	unique("auth_user_groups_user_id_group_id_94350c0c_uniq").on(table.userId, table.groupId),
]);

export const openhirePortfoliohighlight = pgTable("openhire_portfoliohighlight", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "openhire_portfoliohighlight_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	order: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	openToWorkProfileId: bigint("open_to_work_profile_id", { mode: "number" }).notNull(),
}, (table) => [
	index("openhire_portfoliohighlight_open_to_work_profile_id_a93b04b7").using("btree", table.openToWorkProfileId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.openToWorkProfileId],
			foreignColumns: [openhireOpentoworkprofile.id],
			name: "openhire_portfoliohi_open_to_work_profile_a93b04b7_fk_openhire_"
		}),
	check("openhire_portfoliohighlight_order_check", sql`"order" >= 0`),
]);

export const legalLegaldocument = pgTable("legal_legaldocument", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "legal_legaldocument_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	title: varchar({ length: 200 }).notNull(),
	slug: varchar({ length: 200 }).notNull(),
	documentType: varchar("document_type", { length: 20 }).notNull(),
	summary: text().notNull(),
	isPublished: boolean("is_published").notNull(),
	lastUpdated: timestamp("last_updated", { withTimezone: true, mode: 'string' }).notNull(),
	sortOrder: integer("sort_order").notNull(),
}, (table) => [
	index("legal_legal_is_publ_03b95d_idx").using("btree", table.isPublished.asc().nullsLast().op("text_ops"), table.slug.asc().nullsLast().op("bool_ops")),
	index("legal_legaldocument_slug_d0cf8ba1_like").using("btree", table.slug.asc().nullsLast().op("varchar_pattern_ops")),
	unique("legal_legaldocument_slug_key").on(table.slug),
	check("legal_legaldocument_sort_order_check", sql`sort_order >= 0`),
]);

export const legalLegalsection = pgTable("legal_legalsection", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "legal_legalsection_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	heading: varchar({ length: 200 }).notNull(),
	body: text().notNull(),
	items: jsonb().notNull(),
	order: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	documentId: bigint("document_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentId: bigint("parent_id", { mode: "number" }),
}, (table) => [
	index("legal_legal_documen_83d36e_idx").using("btree", table.documentId.asc().nullsLast().op("int4_ops"), table.order.asc().nullsLast().op("int8_ops")),
	index("legal_legalsection_document_id_c0cf7e53").using("btree", table.documentId.asc().nullsLast().op("int8_ops")),
	index("legal_legalsection_parent_id_36558e12").using("btree", table.parentId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [legalLegaldocument.id],
			name: "legal_legalsection_document_id_c0cf7e53_fk_legal_leg"
		}),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "legal_legalsection_parent_id_36558e12_fk_legal_legalsection_id"
		}),
	check("legal_legalsection_order_check", sql`"order" >= 0`),
]);

export const guestbookChatmessage = pgTable("guestbook_chatmessage", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "guestbook_chatmessage_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	message: text().notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	replyToId: bigint("reply_to_id", { mode: "number" }),
	userId: integer("user_id").notNull(),
	isPinned: boolean("is_pinned").notNull(),
	pinnedAt: timestamp("pinned_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("guestbook_c_timesta_c27cf0_idx").using("btree", table.timestamp.desc().nullsFirst().op("timestamptz_ops")),
	index("guestbook_c_user_id_2b80f5_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.timestamp.desc().nullsFirst().op("timestamptz_ops")),
	index("guestbook_chatmessage_reply_to_id_995fd71d").using("btree", table.replyToId.asc().nullsLast().op("int8_ops")),
	index("guestbook_chatmessage_timestamp_5ed2bcc7").using("btree", table.timestamp.asc().nullsLast().op("timestamptz_ops")),
	index("guestbook_chatmessage_user_id_fc941c69").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	index("guestbook_pinned_idx").using("btree", table.isPinned.asc().nullsLast().op("timestamptz_ops"), table.pinnedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.replyToId],
			foreignColumns: [table.id],
			name: "guestbook_chatmessag_reply_to_id_995fd71d_fk_guestbook"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [authUser.id],
			name: "guestbook_chatmessage_user_id_fc941c69_fk_auth_user_id"
		}),
]);

export const aboutEducation = pgTable("about_education", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "about_education_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	degree: varchar({ length: 255 }).notNull(),
	alias: varchar({ length: 100 }),
	isLast: boolean("is_last").notNull(),
	achievements: jsonb().notNull(),
	years: varchar({ length: 50 }),
	locationRegency: varchar("location_regency", { length: 100 }).notNull(),
	locationProvince: varchar("location_province", { length: 100 }).notNull(),
	locationProv: varchar("location_prov", { length: 100 }).notNull(),
	locationCountry: varchar("location_country", { length: 100 }).notNull(),
	locationFlag: varchar("location_flag", { length: 16 }).notNull(),
	locationMapUrl: varchar("location_map_url", { length: 200 }).notNull(),
	dateStart: date("date_start"),
	dateEnd: date("date_end"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
}, (table) => [
	index("about_education_organization_id_e27bc783").using("btree", table.organizationId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [aboutOrganization.id],
			name: "about_education_organization_id_e27bc783_fk_about_org"
		}),
]);

export const accountEmailconfirmation = pgTable("account_emailconfirmation", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "account_emailconfirmation_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	created: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	sent: timestamp({ withTimezone: true, mode: 'string' }),
	key: varchar({ length: 64 }).notNull(),
	emailAddressId: integer("email_address_id").notNull(),
}, (table) => [
	index("account_emailconfirmation_email_address_id_5b7f8c58").using("btree", table.emailAddressId.asc().nullsLast().op("int4_ops")),
	index("account_emailconfirmation_key_f43612bd_like").using("btree", table.key.asc().nullsLast().op("varchar_pattern_ops")),
	foreignKey({
			columns: [table.emailAddressId],
			foreignColumns: [accountEmailaddress.id],
			name: "account_emailconfirm_email_address_id_5b7f8c58_fk_account_e"
		}),
	unique("account_emailconfirmation_key_key").on(table.key),
]);

export const aboutOrganization = pgTable("about_organization", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "about_organization_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	logo: varchar({ length: 100 }),
	website: varchar({ length: 200 }).notNull(),
}, (table) => [
	index("about_organization_name_0a2284da_like").using("btree", table.name.asc().nullsLast().op("varchar_pattern_ops")),
	index("about_organization_slug_6a861254_like").using("btree", table.slug.asc().nullsLast().op("varchar_pattern_ops")),
	unique("about_organization_name_key").on(table.name),
	unique("about_organization_slug_key").on(table.slug),
]);

export const accountEmailaddress = pgTable("account_emailaddress", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "account_emailaddress_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	email: varchar({ length: 254 }).notNull(),
	verified: boolean().notNull(),
	primary: boolean().notNull(),
	userId: integer("user_id").notNull(),
}, (table) => [
	index("account_emailaddress_email_03be32b2").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("account_emailaddress_email_03be32b2_like").using("btree", table.email.asc().nullsLast().op("varchar_pattern_ops")),
	index("account_emailaddress_user_id_2c513194").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_primary_email").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.primary.asc().nullsLast().op("bool_ops")).where(sql`"primary"`),
	uniqueIndex("unique_verified_email").using("btree", table.email.asc().nullsLast().op("text_ops")).where(sql`verified`),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [authUser.id],
			name: "account_emailaddress_user_id_2c513194_fk_auth_user_id"
		}),
	unique("account_emailaddress_user_id_email_987c8728_uniq").on(table.email, table.userId),
]);

export const djangoAdminLog = pgTable("django_admin_log", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "django_admin_log_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	actionTime: timestamp("action_time", { withTimezone: true, mode: 'string' }).notNull(),
	objectId: text("object_id"),
	objectRepr: varchar("object_repr", { length: 200 }).notNull(),
	actionFlag: smallint("action_flag").notNull(),
	changeMessage: text("change_message").notNull(),
	contentTypeId: integer("content_type_id"),
	userId: integer("user_id").notNull(),
}, (table) => [
	index("django_admin_log_content_type_id_c4bce8eb").using("btree", table.contentTypeId.asc().nullsLast().op("int4_ops")),
	index("django_admin_log_user_id_c564eba6").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.contentTypeId],
			foreignColumns: [djangoContentType.id],
			name: "django_admin_log_content_type_id_c4bce8eb_fk_django_co"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [authUser.id],
			name: "django_admin_log_user_id_c564eba6_fk_auth_user_id"
		}),
	check("django_admin_log_action_flag_check", sql`action_flag >= 0`),
]);

export const djangoContentType = pgTable("django_content_type", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "django_content_type_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	appLabel: varchar("app_label", { length: 100 }).notNull(),
	model: varchar({ length: 100 }).notNull(),
}, (table) => [
	unique("django_content_type_app_label_model_76bd3d3b_uniq").on(table.appLabel, table.model),
]);

export const openhireHiringprofile = pgTable("openhire_hiringprofile", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "openhire_hiringprofile_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	companyDescription: text("company_description").notNull(),
	website: varchar({ length: 200 }).notNull(),
	hiringStatus: varchar("hiring_status", { length: 100 }).notNull(),
	applicationProcess: jsonb("application_process").notNull(),
	companyCulture: jsonb("company_culture").notNull(),
	requirementsGeneral: jsonb("requirements_general").notNull(),
	requirementsTechnical: jsonb("requirements_technical").notNull(),
	contactEmail: varchar("contact_email", { length: 254 }).notNull(),
	contactApplicationEmail: varchar("contact_application_email", { length: 254 }).notNull(),
	contactResponseTime: varchar("contact_response_time", { length: 255 }).notNull(),
	contactInterviewProcess: text("contact_interview_process").notNull(),
	additionalNotes: text("additional_notes").notNull(),
});

export const authUser = pgTable("auth_user", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "auth_user_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	password: varchar({ length: 128 }).notNull(),
	lastLogin: timestamp("last_login", { withTimezone: true, mode: 'string' }),
	isSuperuser: boolean("is_superuser").notNull(),
	username: varchar({ length: 150 }).notNull(),
	firstName: varchar("first_name", { length: 150 }).notNull(),
	lastName: varchar("last_name", { length: 150 }).notNull(),
	email: varchar({ length: 254 }).notNull(),
	isStaff: boolean("is_staff").notNull(),
	isActive: boolean("is_active").notNull(),
	dateJoined: timestamp("date_joined", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("auth_user_username_6821ab7c_like").using("btree", table.username.asc().nullsLast().op("varchar_pattern_ops")),
	unique("auth_user_username_key").on(table.username),
]);

export const authUserUserPermissions = pgTable("auth_user_user_permissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "auth_user_user_permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: integer("user_id").notNull(),
	permissionId: integer("permission_id").notNull(),
}, (table) => [
	index("auth_user_user_permissions_permission_id_1fbb5f2c").using("btree", table.permissionId.asc().nullsLast().op("int4_ops")),
	index("auth_user_user_permissions_user_id_a95ead1b").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [authPermission.id],
			name: "auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [authUser.id],
			name: "auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id"
		}),
	unique("auth_user_user_permissions_user_id_permission_id_14a6b632_uniq").on(table.userId, table.permissionId),
]);

export const blogBlogpost = pgTable("blog_blogpost", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "blog_blogpost_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	author: varchar({ length: 100 }).notNull(),
	username: varchar({ length: 100 }).notNull(),
	authorImage: varchar("author_image", { length: 100 }),
	/**
	 * The rich-text body, as HTML.
	 *
	 * This was a JSONB array of blocks, each carrying hand-typed Tailwind
	 * classes; `content` held it alongside this column through the migration so
	 * both stacks kept working and the conversion stayed reversible. Dropped in
	 * drizzle/0003 once the HTML had been what the site served for long enough.
	 */
	contentHtml: text("content_html").default("").notNull(),
	tags: jsonb().notNull(),
	category: varchar({ length: 100 }).notNull(),
	isFeatured: boolean("is_featured").notNull(),
	readTime: integer("read_time"),
	views: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("blog_blogpo_is_feat_aa3e07_idx").using("btree", table.isFeatured.asc().nullsLast().op("bool_ops")),
	index("blog_blogpost_slug_9e84ade1_like").using("btree", table.slug.asc().nullsLast().op("varchar_pattern_ops")),
	unique("blog_blogpost_slug_key").on(table.slug),
	check("blog_blogpost_views_check", sql`views >= 0`),
]);
