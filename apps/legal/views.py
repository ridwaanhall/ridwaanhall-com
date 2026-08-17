"""Legal document pages (privacy policy, terms, anything added later)."""

from django.http import Http404

from apps.core.base_views import BaseView
from apps.legal.manager import LegalManager
from apps.seo.manager import SEOManager
from apps.seo.mixins import PrivacyPolicySEOMixin


class LegalDocumentView(BaseView):
    """Renders any published legal document by slug."""

    template_name = "legal/legal_document.html"
    slug = None

    def _get(self, request, slug=None, *args, **kwargs):
        document = LegalManager.get_document(slug or self.slug)
        if document is None:
            raise Http404("No such document")

        context = self.get_common_context()
        context["document"] = document
        # Sibling documents, for the cross-links at the foot of the page.
        context["documents"] = LegalManager.get_documents()
        # Without this the page has no canonical, no meta description and no
        # structured data -- which is how Terms shipped originally.
        context["seo"] = SEOManager(context["about"]).get_legal_document_seo(document)
        return self.render_to_response(context)


class PrivacyPolicyView(PrivacyPolicySEOMixin, LegalDocumentView):
    """The privacy policy keeps its own URL and SEO wiring.

    It is referenced by the sitemap, the SEO config, the footer of every page
    and the search modal, all of which predate the legal-document model, so it
    is not folded into the generic /legal/<slug>/ route.
    """

    slug = "privacy-policy"

    def _get(self, request, *args, **kwargs):
        document = LegalManager.get_document(self.slug)
        if document is None:
            raise Http404("No such document")

        context = self.get_common_context()
        context["document"] = document
        context["documents"] = LegalManager.get_documents()
        context.update(self.get_context_data(**context))
        return self.render_to_response(context)
