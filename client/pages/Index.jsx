import {
  Banner,
  BlockStack,
  Button,
  Card,
  FormLayout,
  InlineStack,
  Layout,
  Modal,
  Page,
  RadioButton,
  Text,
  TextContainer,
} from "@shopify/polaris";

import { navigate } from "raviger";
import { templates } from "../../server/constants/templates";
import { useCallback, useEffect, useState } from "react";

const HomePage = () => {
  const [template, setTemplate] = useState("");
  const [templateSaved, setTemplateSaved] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [isOptimizationInProgress, setIsOptimizationInProgress] =
    useState(false);
  const [active, setActive] = useState(false);

  const handleModalChange = useCallback(() => setActive(!active), [active]);

  const activator = (
    <Button
      variant="primary"
      disabled={isOptimizationInProgress}
      onClick={handleModalChange}
    >
      {" "}
      {isOptimizationInProgress
        ? "Optimization in Progres..."
        : "Optimize Alt Text"}
    </Button>
  );

  const handleChange = useCallback((_, newValue) => {
    setTemplateSaved(false);
    setTemplate(newValue);
  }, []);

  useEffect(() => {
    //get template

    const fetchTemplate = async () => {
      const { message } = await (
        await fetch("/api/apps/template", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "GET",
        })
      ).json();

      if (message) {
        setTemplate(message.template);
        setIsOptimizationInProgress(message.inprogress);
      }
    };

    fetchTemplate();
    //set template value in ui

    // disable optimizing butt
  }, []);

  console.log("Optimization in progress", isOptimizationInProgress);

  const submitTemplate = useCallback(async () => {
    try {
      setTemplateSaving(true);
      const data = await (
        await fetch("/api/apps/saveTemplate", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ template: template }),
        })
      ).json();
      setTemplateSaved(true);
    } catch (e) {
      console.log(e.message);
    } finally {
      setTemplateSaving(false);
    }
  }, [template, templateSaved, templateSaving]);

  const optimizeImageHandler = useCallback(async () => {
    try {
      setIsOptimizationInProgress(true);
      const data = await (
        await fetch("/api/apps/optimizeAltText", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ template: template }),
        })
      ).json();
    } catch (e) {
      console.log(e.message);
    } finally {
      setActive(false);
    }
  }, [template, templateSaved, templateSaving]);

  return (
    <>
      <Page title="Welcome to Alt Text Optimizer">
        <Layout>
          <Layout.Section variant="fullWidth">
            {isOptimizationInProgress && (
              <div style={{ marginBottom: "20px" }}>
                <Banner
                  tone="info"
                  title="Image Optimization is in progress..."
                />
              </div>
            )}

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Choose one of the default options or customize your own
                  template:
                </Text>
                <Text>
                  Search engines use the information that alt text provides to
                  determine the best image to return for a search query. This is
                  a great way to both bring new visitors to your site and
                  increase your rankings with search engines.
                </Text>

                <FormLayout>
                  {templates.map((tplt) => (
                    <RadioButton
                      name="template"
                      checked={template === tplt["value"]}
                      id={tplt["value"]}
                      label={tplt["value"]}
                      onChange={handleChange}
                    />
                  ))}
                </FormLayout>

                <InlineStack wrap={false} gap="400" align="end">
                  <Button
                    variant={"primary"}
                    disabled={templateSaved}
                    loading={templateSaving}
                    onClick={submitTemplate}
                  >
                    {templateSaved ? "Template Saved" : "Save Template"}
                  </Button>
                  {templateSaved && (
                    <Modal
                      activator={activator}
                      open={active}
                      onClose={handleModalChange}
                      title="Confirmation"
                      primaryAction={{
                        content: "Optimize all Images",
                        onAction: optimizeImageHandler,
                      }}
                      secondaryActions={[
                        {
                          content: "Update Template",
                          onAction: handleModalChange,
                        },
                      ]}
                    >
                      <Modal.Section>
                        <TextContainer>
                          <p>
                            Optimize all product images using this template:{" "}
                            <br /> {template}?
                          </p>
                        </TextContainer>
                      </Modal.Section>
                    </Modal>
                  )}
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
};

export default HomePage;