{{ 'section-video-banner.css' | asset_url | stylesheet_tag }}


{%- style -%}
  #Banner-{{ section.id }}::after {
    opacity: {{ section.settings.image_overlay_opacity | divided_by: 100.0 }};
  }
{%- endstyle -%}


<div
  id="Banner-{{ section.id }}"
  class="banner video-background banner--content-align-{{ section.settings.desktop_content_alignment }} banner--content-align-mobile-{{ section.settings.mobile_content_alignment }} banner{% if section.settings.show_text_below %} banner--mobile-bottom{%- endif -%}{% if section.settings.show_text_box == false %} banner--desktop-transparent{% endif %}"
>
  <div class="banner__media media video-background">  
  	<video autoplay muted loop playsinline id="myVideo">
    	<source src={{ section.settings.video_url }} type="video/mp4">
    	Your browser does not support HTML5 video.
  	</video>
  </div>                                                                                                                 	 

  <div class="banner__content banner__content--{{ section.settings.desktop_content_position }} page-width">
    <div class="banner__box content-container content-container--full-width-mobile color-{{ section.settings.color_scheme }} gradient">
      {%- for block in section.blocks -%}
        {%- case block.type -%}
          {%- when 'heading' -%}
            <h2
              class="banner__heading inline-richtext {{ block.settings.heading_size }}"
              {{ block.shopify_attributes }}
            >
              {{ block.settings.heading }}
            </h2>
          {%- when 'text' -%}
            <div class="banner__text rte {{ block.settings.text_style }}" {{ block.shopify_attributes }}>
              <p>{{ block.settings.text }}</p>
            </div>
          {%- when 'buttons' -%}
            <div
              class="banner__buttons{% if block.settings.button_label_1 != blank and block.settings.button_label_2 != blank %} banner__buttons--multiple{% endif %}"
              {{ block.shopify_attributes }}
            >
              {%- if block.settings.button_label_1 != blank -%}
                <a
                  {% if block.settings.button_link_1 == blank %}
                    role="link" aria-disabled="true"
                  {% else %}
                    href="{{ block.settings.button_link_1 }}"
                  {% endif %}
                  class="button{% if block.settings.button_style_secondary_1 %} button--secondary{% else %} button--primary{% endif %}"
                >
                  {{- block.settings.button_label_1 | escape -}}
                </a>
              {%- endif -%}
              {%- if block.settings.button_label_2 != blank -%}
                <a
                  {% if block.settings.button_link_2 == blank %}
                    role="link" aria-disabled="true"
                  {% else %}
                    href="{{ block.settings.button_link_2 }}"
                  {% endif %}
                  class="button{% if block.settings.button_style_secondary_2 %} button--secondary{% else %} button--primary{% endif %}"
                >
                  {{- block.settings.button_label_2 | escape -}}
                </a>
              {%- endif -%}
            </div>
        {%- endcase -%}
      {%- endfor -%}
    </div>
  </div>
</div>

{% schema %}
{
  "name": "Video Banner",
  "tag": "section",
  "class": "section",
  "disabled_on": {
    "groups": ["header", "footer"]
  },
  "settings": [
	{
      "type": "text",
      "id": "video_url",
      "label": "Video Url"
    },
    {
      "type": "select",
      "id": "desktop_content_position",
      "options": [
        {
          "value": "top-left",
          "label": "t:sections.image-banner.settings.desktop_content_position.options__1.label"
        },
        {
          "value": "top-center",
          "label": "t:sections.image-banner.settings.desktop_content_position.options__2.label"
        },
        {
          "value": "top-right",
          "label": "t:sections.image-banner.settings.desktop_content_position.options__3.label"
        },
        {
          "value": "middle-left",
          "label": "t:sections.image-banner.settings.desktop_content_position.options__4.label"
        },
        {
          "value": "middle-center",
          "label": "t:sections.image-banner.settings.desktop_content_position.options__5.label"
        },
        {
          "value": "middle-right",
          "label": "t:sections.image-banner.settings.desktop_content_position.options__6.label"
        },
        {
          "value": "bottom-left",
          "label": "t:sections.image-banner.settings.desktop_content_position.options__7.label"
        },
        {
          "value": "bottom-center",
          "label": "t:sections.image-banner.settings.desktop_content_position.options__8.label"
        },
        {
          "value": "bottom-right",
          "label": "t:sections.image-banner.settings.desktop_content_position.options__9.label"
        }
      ],
      "default": "middle-center",
      "label": "t:sections.image-banner.settings.desktop_content_position.label"
    },
    {
      "type": "checkbox",
      "id": "show_text_box",
      "default": true,
      "label": "t:sections.image-banner.settings.show_text_box.label"
    },
    {
      "type": "select",
      "id": "desktop_content_alignment",
      "options": [
        {
          "value": "left",
          "label": "t:sections.image-banner.settings.desktop_content_alignment.options__1.label"
        },
        {
          "value": "center",
          "label": "t:sections.image-banner.settings.desktop_content_alignment.options__2.label"
        },
        {
          "value": "right",
          "label": "t:sections.image-banner.settings.desktop_content_alignment.options__3.label"
        }
      ],
      "default": "center",
      "label": "t:sections.image-banner.settings.desktop_content_alignment.label"
    },
    {
      "type": "color_scheme",
      "id": "color_scheme",
      "label": "t:sections.all.colors.label",
      "default": "scheme-1"
    },
    {
      "type": "header",
      "content": "t:sections.image-banner.settings.mobile.content"
    },
    {
      "type": "select",
      "id": "mobile_content_alignment",
      "options": [
        {
          "value": "left",
          "label": "t:sections.image-banner.settings.mobile_content_alignment.options__1.label"
        },
        {
          "value": "center",
          "label": "t:sections.image-banner.settings.mobile_content_alignment.options__2.label"
        },
        {
          "value": "right",
          "label": "t:sections.image-banner.settings.mobile_content_alignment.options__3.label"
        }
      ],
      "default": "center",
      "label": "t:sections.image-banner.settings.mobile_content_alignment.label"
    },
  ],
  "blocks": [
    {
      "type": "heading",
      "name": "Video Banner",
      "limit": 1,
      "settings": [
        {
          "type": "inline_richtext",
          "id": "heading",
          "default": "t:sections.image-banner.blocks.heading.settings.heading.default",
          "label": "t:sections.image-banner.blocks.heading.settings.heading.label"
        },
        {
          "type": "select",
          "id": "heading_size",
          "options": [
            {
              "value": "h2",
              "label": "t:sections.all.heading_size.options__1.label"
            },
            {
              "value": "h1",
              "label": "t:sections.all.heading_size.options__2.label"
            },
            {
              "value": "h0",
              "label": "t:sections.all.heading_size.options__3.label"
            },
            {
              "value": "hxl",
              "label": "t:sections.all.heading_size.options__4.label"
            },
            {
              "value": "hxxl",
              "label": "t:sections.all.heading_size.options__5.label"
            }
          ],
          "default": "h1",
          "label": "t:sections.all.heading_size.label"
        }
      ]
    },
    {
      "type": "text",
      "name": "Video Banner Heading",
      "limit": 1,
      "settings": [
        {
          "type": "inline_richtext",
          "id": "text",
          "default": "t:sections.image-banner.blocks.text.settings.text.default",
          "label": "t:sections.image-banner.blocks.text.settings.text.label"
        },
        {
          "type": "select",
          "id": "text_style",
          "options": [
            {
              "value": "body",
              "label": "t:sections.image-banner.blocks.text.settings.text_style.options__1.label"
            },
            {
              "value": "subtitle",
              "label": "t:sections.image-banner.blocks.text.settings.text_style.options__2.label"
            },
            {
              "value": "caption-with-letter-spacing",
              "label": "t:sections.image-banner.blocks.text.settings.text_style.options__3.label"
            }
          ],
          "default": "body",
          "label": "t:sections.image-banner.blocks.text.settings.text_style.label"
        }
      ]
    },
    {
      "type": "buttons",
      "name": "t:sections.image-banner.blocks.buttons.name",
      "limit": 1,
      "settings": [
        {
          "type": "text",
          "id": "button_label_1",
          "default": "t:sections.image-banner.blocks.buttons.settings.button_label_1.default",
          "label": "t:sections.image-banner.blocks.buttons.settings.button_label_1.label",
          "info": "t:sections.image-banner.blocks.buttons.settings.button_label_1.info"
        },
        {
          "type": "url",
          "id": "button_link_1",
          "label": "t:sections.image-banner.blocks.buttons.settings.button_link_1.label"
        },
        {
          "type": "checkbox",
          "id": "button_style_secondary_1",
          "default": false,
          "label": "t:sections.image-banner.blocks.buttons.settings.button_style_secondary_1.label"
        },
        {
          "type": "text",
          "id": "button_label_2",
          "default": "t:sections.image-banner.blocks.buttons.settings.button_label_2.default",
          "label": "t:sections.image-banner.blocks.buttons.settings.button_label_2.label",
          "info": "t:sections.image-banner.blocks.buttons.settings.button_label_2.info"
        },
        {
          "type": "url",
          "id": "button_link_2",
          "label": "t:sections.image-banner.blocks.buttons.settings.button_link_2.label"
        },
        {
          "type": "checkbox",
          "id": "button_style_secondary_2",
          "default": false,
          "label": "t:sections.image-banner.blocks.buttons.settings.button_style_secondary_2.label"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Video Banner",
      "blocks": [
        {
          "type": "heading"
        },
        {
          "type": "text"
        },
        {
          "type": "buttons"
        }
      ]
    }
  ]
}
{% endschema %}