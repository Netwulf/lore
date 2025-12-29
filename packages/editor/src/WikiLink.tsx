'use client';

import { createReactInlineContentSpec } from '@blocknote/react';
import { useRouter } from 'next/navigation';

/**
 * WikiLink - Custom inline content for [[page links]]
 *
 * Renders as clickable links with Tech Olive styling.
 * Stores pageId and pageTitle for navigation.
 */
export const WikiLink = createReactInlineContentSpec(
  {
    type: 'wikiLink',
    propSchema: {
      pageId: {
        default: '',
      },
      pageTitle: {
        default: 'Untitled',
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const { pageId, pageTitle } = props.inlineContent.props;

      const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Navigate using window.location since we can't use hooks here
        window.location.href = `/page/${pageId}`;
      };

      return (
        <a
          href={`/page/${pageId}`}
          onClick={handleClick}
          className="wiki-link"
          data-page-id={pageId}
          style={{
            color: '#8dc75e',
            textDecoration: 'none',
            cursor: 'pointer',
            borderBottom: '1px solid transparent',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderBottomColor = '#8dc75e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderBottomColor = 'transparent';
          }}
        >
          {pageTitle}
        </a>
      );
    },
  }
);

export default WikiLink;
