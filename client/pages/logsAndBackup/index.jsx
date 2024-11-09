import {
  IndexTable,
  Card,
  Pagination,
  Link,
  Page,
  Button,
  TextContainer,
  Modal,
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";

function LogsAndBackup() {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(0);
  const [active, setActive] = useState(false);

  const handleModalChange = useCallback(() => setActive(!active), [active]);

  const limit = 20; // Items per page

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    const offset = page * limit;

    try {
      const response = await fetch(
        `/api/apps/logs?limit=${limit}&offset=${offset}`
      );
      const data = await response.json();
      setLogs(data.logs);
      setTotalLogs(data.pagination.total);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const handleNextPage = () => {
    if ((page + 1) * limit < totalLogs) setPage(page + 1);
  };

  const handlePreviousPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleBackup = () => {
    setActive(true);
  };

  const rollbackHandler = async () => {
      try {
        console.log("This is rollback handlerd.......")
        const data = await (
          await fetch("/api/apps/revertAltText", {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({}),
          })
        ).json();
      } catch (e) {
        console.log(e.message);
      } finally {
        console.log("THis is false.....")
        setActive(false);
      }
    };

  const rowMarkup = logs.map(
    ({ productId, mediaId, oldAltText, newAltText }, index) => (
      <IndexTable.Row id={mediaId} key={mediaId} position={index}>
        <IndexTable.Cell>{page * limit + (index + 1)}</IndexTable.Cell>
        <IndexTable.Cell>{productId}</IndexTable.Cell>
        <IndexTable.Cell>{mediaId}</IndexTable.Cell>
        <IndexTable.Cell>{oldAltText}</IndexTable.Cell>
        <IndexTable.Cell>{newAltText}</IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  return (
    <Page
      title="Logs and Backup"
      fullWidth
      primaryAction={{
        content: "Roll back to Previous Alt Text",
        accessibilityLabel: "Back up",
        onAction: handleBackup,
      }}
    >
      <Modal
        open={active}
        onClose={handleModalChange}
        title="Confirmation"
        primaryAction={{
          content: "Revert All the Changes",
          onAction: rollbackHandler,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleModalChange,
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>Rollback all the changes?</p>
          </TextContainer>
        </Modal.Section>
      </Modal>

      <Card>
        <IndexTable
          itemCount={totalLogs}
          resourceName={{ singular: "log", plural: "logs" }}
          headings={[
            { title: "Index" },
            { title: "Product Id" },
            { title: "Media Id" },
            { title: "Old Alt Text" },
            { title: "New Alt Text" },
          ]}
          selectable={false}
        >
          {rowMarkup}
        </IndexTable>
        <Pagination
          hasPrevious={page > 0}
          onPrevious={handlePreviousPage}
          hasNext={(page + 1) * limit < totalLogs}
          onNext={handleNextPage}
        />
      </Card>
    </Page>
  );
}

export default LogsAndBackup;
