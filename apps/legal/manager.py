"""
Access layer for legal documents.

Follows the project's existing convention: views and templates talk to a
manager that hands back plain dicts, never the ORM directly, and the result is
cached per namespace. One query loads a whole document with its sections.
"""

from apps.core import cache as content_cache


class LegalManager:
    @classmethod
    def get_documents(cls):
        """Every published document, sections included."""
        return content_cache.get_or_build("legal_documents", cls._build_documents)

    @classmethod
    def get_document(cls, slug):
        """One published document as a dict, or None.

        Resolved from the cached list rather than re-querying: the documents are
        few and already in memory, so a fresh lookup would only cost a round
        trip. Mirrors how the blog and project detail pages resolve a slug.
        """
        for document in cls.get_documents():
            if document["slug"] == slug:
                return document
        return None

    @classmethod
    def _build_documents(cls):
        from apps.legal.models import LegalDocument

        documents = (
            LegalDocument.objects.filter(is_published=True)
            .prefetch_related("sections", "sections__children")
        )
        return [cls._document_to_dict(document) for document in documents]

    @staticmethod
    def _section_to_dict(section):
        return {
            "heading": section.heading,
            "body": section.body,
            "items": section.items or {},
            "children": [
                {
                    "heading": child.heading,
                    "body": child.body,
                    "items": child.items or {},
                }
                # Iterating the prefetched relation rather than filtering it
                # keeps this to the two queries already issued.
                for child in section.children.all()
            ],
        }

    @staticmethod
    def _split_title(title):
        """Split "Privacy Policy" into ("Privacy", "Policy").

        The page headings on this site accent the last word in indigo; doing the
        split here keeps that out of the template, where Django has no way to
        partition a string.
        """
        lead, _, accent = title.rpartition(" ")
        return (lead, accent) if lead else ("", title)

    @classmethod
    def _document_to_dict(cls, document):
        title_lead, title_accent = cls._split_title(document.title)
        return {
            "title": document.title,
            "title_lead": title_lead,
            "title_accent": title_accent,
            "slug": document.slug,
            "document_type": document.document_type,
            "summary": document.summary,
            "last_updated": document.last_updated,
            "url": document.get_absolute_url(),
            "sections": [
                cls._section_to_dict(section)
                for section in document.sections.all()
                if section.parent_id is None
            ],
        }
