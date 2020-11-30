// @flow
import { observable } from "mobx";
import { observer } from "mobx-react";
import { CollapsedIcon } from "outline-icons";
import * as React from "react";
import styled, { withTheme } from "styled-components";
import DocumentsStore from "stores/DocumentsStore";
import Collection from "models/Collection";
import Document from "models/Document";
import DropToImport from "components/DropToImport";
import Fade from "components/Fade";
import EditableTitle from "./EditableTitle";
import SidebarLink from "./SidebarLink";
import DocumentMenu from "menus/DocumentMenu";
import { type NavigationNode } from "types";

type Props = {|
  node: NavigationNode,
  documents: DocumentsStore,
  canUpdate: boolean,
  collection?: Collection,
  activeDocument: ?Document,
  activeDocumentRef?: (?HTMLElement) => void,
  prefetchDocument: (documentId: string) => Promise<void>,
  depth: number,
|};

type State = {|
  expanded: string,
|};

@observer
class DocumentLink extends React.Component<Props, State> {
  @observable menuOpen = false;

  componentDidMount() {
    if (this.isActiveDocument() && this.hasChildDocuments()) {
      this.props.documents.fetchChildDocuments(this.props.node.id);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.activeDocument !== this.props.activeDocument) {
      if (this.isActiveDocument() && this.hasChildDocuments()) {
        this.props.documents.fetchChildDocuments(this.props.node.id);
      }
    }
  }

  handleMouseEnter = (ev: SyntheticEvent<>) => {
    const { node, prefetchDocument } = this.props;

    ev.stopPropagation();
    ev.preventDefault();
    prefetchDocument(node.id);
  };

  handleTitleChange = async (title: string) => {
    const document = this.props.documents.get(this.props.node.id);
    if (!document) return;

    await this.props.documents.update({
      id: document.id,
      lastRevision: document.revision,
      text: document.text,
      title,
    });
  };

  isActiveDocument = () => {
    return (
      this.props.activeDocument &&
      this.props.activeDocument.id === this.props.node.id
    );
  };

  hasChildDocuments = () => {
    return !!this.props.node.children.length;
  };

  render() {
    const {
      node,
      documents,
      collection,
      activeDocument,
      activeDocumentRef,
      prefetchDocument,
      depth,
      canUpdate,
    } = this.props;

    // const [expanded, setExpanded] = React.useState(rest.expanded);

    // React.useEffect(() => {
    //   if (rest.expanded !== undefined) {
    //     setExpanded(rest.expanded);
    //   }
    // }, [rest.expanded]);

    // const handleClick = React.useCallback(
    //   (ev: SyntheticEvent<>) => {
    //     ev.preventDefault();
    //     ev.stopPropagation();
    //     // setExpanded(!expanded);
    //   },
    //   [expanded]
    // );

    // const handleExpand = React.useCallback(() => {
    //   console.log("EXPAND");
    //   // setExpanded(true);
    // }, []);

    const showChildren = !!(
      activeDocument &&
      collection &&
      (collection
        .pathToDocument(activeDocument)
        .map((entry) => entry.id)
        .includes(node.id) ||
        this.isActiveDocument())
    );

    const document = documents.get(node.id);
    const title = node.title || "Untitled";
    return (
      <React.Fragment key={node.id}>
        <SidebarLink
          innerRef={this.isActiveDocument() ? activeDocumentRef : undefined}
          onMouseEnter={this.handleMouseEnter}
          to={{
            pathname: node.url,
            state: { title: node.title },
          }}
          // expanded={showChildren ? true : undefined}
          label={
            <DropToImport documentId={node.id} activeClassName="activeDropZone">
              {this.hasChildDocuments() && (
                <Disclosure expanded={showChildren} onClick={() => {}} />
              )}
              <EditableTitle
                title={title}
                onSubmit={this.handleTitleChange}
                canUpdate={canUpdate}
              />
            </DropToImport>
          }
          depth={depth}
          exact={false}
          menuOpen={this.menuOpen}
          menu={
            document ? (
              <Fade>
                <DocumentMenu
                  position="right"
                  document={document}
                  onOpen={() => (this.menuOpen = true)}
                  onClose={() => (this.menuOpen = false)}
                />
              </Fade>
            ) : undefined
          }
        ></SidebarLink>
        {showChildren && this.hasChildDocuments() && (
          <>
            {node.children.map((childNode) => (
              <DocumentLink
                key={childNode.id}
                collection={collection}
                node={childNode}
                documents={documents}
                activeDocument={activeDocument}
                prefetchDocument={prefetchDocument}
                depth={depth + 1}
                canUpdate={canUpdate}
              />
            ))}
          </>
        )}
      </React.Fragment>
    );
  }
}

const Disclosure = styled(CollapsedIcon)`
  position: absolute;
  left: -24px;

  ${({ expanded }) => !expanded && "transform: rotate(-90deg);"};
`;

export default DocumentLink;
