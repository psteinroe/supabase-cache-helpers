create table if not exists public.continent (
  code char(2) primary key not null,
  name text
);
insert into public.continent
values ('AF', 'Africa'),
  ('AS', 'Asia'),
  ('EU', 'Europe'),
  ('NA', 'North America'),
  ('SA', 'South America'),
  ('OC', 'Oceania'),
  ('AN', 'Antarctica');
create table public.country (
  code char(2) primary key not null,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  iso3 CHAR(3) NOT NULL,
  number CHAR(3) NOT NULL,
  continent_code CHAR(2) NOT NULL references public.continent
);
comment on column public.country.code is 'Two-letter country code (ISO 3166-1 alpha-2)';
comment on column public.country.name is 'English country name';
comment on column public.country.full_name is 'Full English country name';
comment on column public.country.iso3 is 'Three-letter country code (ISO 3166-1 alpha-3)';
comment on column public.country.number is 'Three-digit country number (ISO 3166-1 numeric)';
INSERT INTO public.country (
    code,
    continent_code,
    name,
    iso3,
    number,
    full_name
  )
VALUES (
    'AF',
    'AS',
    'Afghanistan',
    'AFG',
    '004',
    'Islamic Republic of Afghanistan'
  ),
  (
    'AX',
    'EU',
    'Åland Islands',
    'ALA',
    '248',
    'Åland Islands'
  ),
  (
    'AL',
    'EU',
    'Albania',
    'ALB',
    '008',
    'Republic of Albania'
  ),
  (
    'DZ',
    'AF',
    'Algeria',
    'DZA',
    '012',
    'Peoples Democratic Republic of Algeria'
  ),
  (
    'AS',
    'OC',
    'American Samoa',
    'ASM',
    '016',
    'American Samoa'
  ),
  (
    'AD',
    'EU',
    'Andorra',
    'AND',
    '020',
    'Principality of Andorra'
  ),
  (
    'AO',
    'AF',
    'Angola',
    'AGO',
    '024',
    'Republic of Angola'
  ),
  ('AI', 'NA', 'Anguilla', 'AIA', '660', 'Anguilla'),
  (
    'AQ',
    'AN',
    'Antarctica',
    'ATA',
    '010',
    'Antarctica (the territory South of 60 deg S)'
  ),
  (
    'AG',
    'NA',
    'Antigua and Barbuda',
    'ATG',
    '028',
    'Antigua and Barbuda'
  ),
  (
    'AR',
    'SA',
    'Argentina',
    'ARG',
    '032',
    'Argentine Republic'
  ),
  (
    'AM',
    'AS',
    'Armenia',
    'ARM',
    '051',
    'Republic of Armenia'
  ),
  ('AW', 'NA', 'Aruba', 'ABW', '533', 'Aruba'),
  (
    'AU',
    'OC',
    'Australia',
    'AUS',
    '036',
    'Commonwealth of Australia'
  ),
  (
    'AT',
    'EU',
    'Austria',
    'AUT',
    '040',
    'Republic of Austria'
  ),
  (
    'AZ',
    'AS',
    'Azerbaijan',
    'AZE',
    '031',
    'Republic of Azerbaijan'
  ),
  (
    'BS',
    'NA',
    'Bahamas',
    'BHS',
    '044',
    'Commonwealth of the Bahamas'
  ),
  (
    'BH',
    'AS',
    'Bahrain',
    'BHR',
    '048',
    'Kingdom of Bahrain'
  ),
  (
    'BD',
    'AS',
    'Bangladesh',
    'BGD',
    '050',
    'Peoples Republic of Bangladesh'
  ),
  ('BB', 'NA', 'Barbados', 'BRB', '052', 'Barbados'),
  (
    'BY',
    'EU',
    'Belarus',
    'BLR',
    '112',
    'Republic of Belarus'
  ),
  (
    'BE',
    'EU',
    'Belgium',
    'BEL',
    '056',
    'Kingdom of Belgium'
  ),
  ('BZ', 'NA', 'Belize', 'BLZ', '084', 'Belize'),
  (
    'BJ',
    'AF',
    'Benin',
    'BEN',
    '204',
    'Republic of Benin'
  ),
  ('BM', 'NA', 'Bermuda', 'BMU', '060', 'Bermuda'),
  (
    'BT',
    'AS',
    'Bhutan',
    'BTN',
    '064',
    'Kingdom of Bhutan'
  ),
  (
    'BO',
    'SA',
    'Bolivia',
    'BOL',
    '068',
    'Plurinational State of Bolivia'
  ),
  (
    'BQ',
    'NA',
    'Bonaire, Sint Eustatius and Saba',
    'BES',
    '535',
    'Bonaire, Sint Eustatius and Saba'
  ),
  (
    'BA',
    'EU',
    'Bosnia and Herzegovina',
    'BIH',
    '070',
    'Bosnia and Herzegovina'
  ),
  (
    'BW',
    'AF',
    'Botswana',
    'BWA',
    '072',
    'Republic of Botswana'
  ),
  (
    'BV',
    'AN',
    'Bouvet Island (Bouvetøya)',
    'BVT',
    '074',
    'Bouvet Island (Bouvetøya)'
  ),
  (
    'BR',
    'SA',
    'Brazil',
    'BRA',
    '076',
    'Federative Republic of Brazil'
  ),
  (
    'IO',
    'AS',
    'British Indian Ocean Territory (Chagos Archipelago)',
    'IOT',
    '086',
    'British Indian Ocean Territory (Chagos Archipelago)'
  ),
  (
    'VG',
    'NA',
    'British Virgin Islands',
    'VGB',
    '092',
    'British Virgin Islands'
  ),
  (
    'BN',
    'AS',
    'Brunei Darussalam',
    'BRN',
    '096',
    'Brunei Darussalam'
  ),
  (
    'BG',
    'EU',
    'Bulgaria',
    'BGR',
    '100',
    'Republic of Bulgaria'
  ),
  (
    'BF',
    'AF',
    'Burkina Faso',
    'BFA',
    '854',
    'Burkina Faso'
  ),
  (
    'BI',
    'AF',
    'Burundi',
    'BDI',
    '108',
    'Republic of Burundi'
  ),
  (
    'KH',
    'AS',
    'Cambodia',
    'KHM',
    '116',
    'Kingdom of Cambodia'
  ),
  (
    'CM',
    'AF',
    'Cameroon',
    'CMR',
    '120',
    'Republic of Cameroon'
  ),
  ('CA', 'NA', 'Canada', 'CAN', '124', 'Canada'),
  (
    'CV',
    'AF',
    'Cabo Verde',
    'CPV',
    '132',
    'Republic of Cabo Verde'
  ),
  (
    'KY',
    'NA',
    'Cayman Islands',
    'CYM',
    '136',
    'Cayman Islands'
  ),
  (
    'CF',
    'AF',
    'Central African Republic',
    'CAF',
    '140',
    'Central African Republic'
  ),
  (
    'TD',
    'AF',
    'Chad',
    'TCD',
    '148',
    'Republic of Chad'
  ),
  (
    'CL',
    'SA',
    'Chile',
    'CHL',
    '152',
    'Republic of Chile'
  ),
  (
    'CN',
    'AS',
    'China',
    'CHN',
    '156',
    'Peoples Republic of China'
  ),
  (
    'CX',
    'AS',
    'Christmas Island',
    'CXR',
    '162',
    'Christmas Island'
  ),
  (
    'CC',
    'AS',
    'Cocos (Keeling) Islands',
    'CCK',
    '166',
    'Cocos (Keeling) Islands'
  ),
  (
    'CO',
    'SA',
    'Colombia',
    'COL',
    '170',
    'Republic of Colombia'
  ),
  (
    'KM',
    'AF',
    'Comoros',
    'COM',
    '174',
    'Union of the Comoros'
  ),
  (
    'CD',
    'AF',
    'Congo',
    'COD',
    '180',
    'Democratic Republic of the Congo'
  ),
  (
    'CG',
    'AF',
    'Congo',
    'COG',
    '178',
    'Republic of the Congo'
  ),
  (
    'CK',
    'OC',
    'Cook Islands',
    'COK',
    '184',
    'Cook Islands'
  ),
  (
    'CR',
    'NA',
    'Costa Rica',
    'CRI',
    '188',
    'Republic of Costa Rica'
  ),
  (
    'CI',
    'AF',
    'Cote dIvoire',
    'CIV',
    '384',
    'Republic of Cote dIvoire'
  ),
  (
    'HR',
    'EU',
    'Croatia',
    'HRV',
    '191',
    'Republic of Croatia'
  ),
  (
    'CU',
    'NA',
    'Cuba',
    'CUB',
    '192',
    'Republic of Cuba'
  ),
  ('CW', 'NA', 'Curaçao', 'CUW', '531', 'Curaçao'),
  (
    'CY',
    'AS',
    'Cyprus',
    'CYP',
    '196',
    'Republic of Cyprus'
  ),
  (
    'CZ',
    'EU',
    'Czechia',
    'CZE',
    '203',
    'Czech Republic'
  ),
  (
    'DK',
    'EU',
    'Denmark',
    'DNK',
    '208',
    'Kingdom of Denmark'
  ),
  (
    'DJ',
    'AF',
    'Djibouti',
    'DJI',
    '262',
    'Republic of Djibouti'
  ),
  (
    'DM',
    'NA',
    'Dominica',
    'DMA',
    '212',
    'Commonwealth of Dominica'
  ),
  (
    'DO',
    'NA',
    'Dominican Republic',
    'DOM',
    '214',
    'Dominican Republic'
  ),
  (
    'EC',
    'SA',
    'Ecuador',
    'ECU',
    '218',
    'Republic of Ecuador'
  ),
  (
    'EG',
    'AF',
    'Egypt',
    'EGY',
    '818',
    'Arab Republic of Egypt'
  ),
  (
    'SV',
    'NA',
    'El Salvador',
    'SLV',
    '222',
    'Republic of El Salvador'
  ),
  (
    'GQ',
    'AF',
    'Equatorial Guinea',
    'GNQ',
    '226',
    'Republic of Equatorial Guinea'
  ),
  (
    'ER',
    'AF',
    'Eritrea',
    'ERI',
    '232',
    'State of Eritrea'
  ),
  (
    'EE',
    'EU',
    'Estonia',
    'EST',
    '233',
    'Republic of Estonia'
  ),
  (
    'ET',
    'AF',
    'Ethiopia',
    'ETH',
    '231',
    'Federal Democratic Republic of Ethiopia'
  ),
  (
    'FO',
    'EU',
    'Faroe Islands',
    'FRO',
    '234',
    'Faroe Islands'
  ),
  (
    'FK',
    'SA',
    'Falkland Islands (Malvinas)',
    'FLK',
    '238',
    'Falkland Islands (Malvinas)'
  ),
  (
    'FJ',
    'OC',
    'Fiji',
    'FJI',
    '242',
    'Republic of Fiji'
  ),
  (
    'FI',
    'EU',
    'Finland',
    'FIN',
    '246',
    'Republic of Finland'
  ),
  (
    'FR',
    'EU',
    'France',
    'FRA',
    '250',
    'French Republic'
  ),
  (
    'GF',
    'SA',
    'French Guiana',
    'GUF',
    '254',
    'French Guiana'
  ),
  (
    'PF',
    'OC',
    'French Polynesia',
    'PYF',
    '258',
    'French Polynesia'
  ),
  (
    'TF',
    'AN',
    'French Southern Territories',
    'ATF',
    '260',
    'French Southern Territories'
  ),
  (
    'GA',
    'AF',
    'Gabon',
    'GAB',
    '266',
    'Gabonese Republic'
  ),
  (
    'GM',
    'AF',
    'Gambia',
    'GMB',
    '270',
    'Republic of the Gambia'
  ),
  ('GE', 'AS', 'Georgia', 'GEO', '268', 'Georgia'),
  (
    'DE',
    'EU',
    'Germany',
    'DEU',
    '276',
    'Federal Republic of Germany'
  ),
  (
    'GH',
    'AF',
    'Ghana',
    'GHA',
    '288',
    'Republic of Ghana'
  ),
  (
    'GI',
    'EU',
    'Gibraltar',
    'GIB',
    '292',
    'Gibraltar'
  ),
  (
    'GR',
    'EU',
    'Greece',
    'GRC',
    '300',
    'Hellenic Republic of Greece'
  ),
  (
    'GL',
    'NA',
    'Greenland',
    'GRL',
    '304',
    'Greenland'
  ),
  ('GD', 'NA', 'Grenada', 'GRD', '308', 'Grenada'),
  (
    'GP',
    'NA',
    'Guadeloupe',
    'GLP',
    '312',
    'Guadeloupe'
  ),
  ('GU', 'OC', 'Guam', 'GUM', '316', 'Guam'),
  (
    'GT',
    'NA',
    'Guatemala',
    'GTM',
    '320',
    'Republic of Guatemala'
  ),
  (
    'GG',
    'EU',
    'Guernsey',
    'GGY',
    '831',
    'Bailiwick of Guernsey'
  ),
  (
    'GN',
    'AF',
    'Guinea',
    'GIN',
    '324',
    'Republic of Guinea'
  ),
  (
    'GW',
    'AF',
    'Guinea-Bissau',
    'GNB',
    '624',
    'Republic of Guinea-Bissau'
  ),
  (
    'GY',
    'SA',
    'Guyana',
    'GUY',
    '328',
    'Co-operative Republic of Guyana'
  ),
  (
    'HT',
    'NA',
    'Haiti',
    'HTI',
    '332',
    'Republic of Haiti'
  ),
  (
    'HM',
    'AN',
    'Heard Island and McDonald Islands',
    'HMD',
    '334',
    'Heard Island and McDonald Islands'
  ),
  (
    'VA',
    'EU',
    'Holy See (Vatican City State)',
    'VAT',
    '336',
    'Holy See (Vatican City State)'
  ),
  (
    'HN',
    'NA',
    'Honduras',
    'HND',
    '340',
    'Republic of Honduras'
  ),
  (
    'HK',
    'AS',
    'Hong Kong',
    'HKG',
    '344',
    'Hong Kong Special Administrative Region of China'
  ),
  ('HU', 'EU', 'Hungary', 'HUN', '348', 'Hungary'),
  (
    'IS',
    'EU',
    'Iceland',
    'ISL',
    '352',
    'Republic of Iceland'
  ),
  (
    'IN',
    'AS',
    'India',
    'IND',
    '356',
    'Republic of India'
  ),
  (
    'ID',
    'AS',
    'Indonesia',
    'IDN',
    '360',
    'Republic of Indonesia'
  ),
  (
    'IR',
    'AS',
    'Iran',
    'IRN',
    '364',
    'Islamic Republic of Iran'
  ),
  (
    'IQ',
    'AS',
    'Iraq',
    'IRQ',
    '368',
    'Republic of Iraq'
  ),
  ('IE', 'EU', 'Ireland', 'IRL', '372', 'Ireland'),
  (
    'IM',
    'EU',
    'Isle of Man',
    'IMN',
    '833',
    'Isle of Man'
  ),
  (
    'IL',
    'AS',
    'Israel',
    'ISR',
    '376',
    'State of Israel'
  ),
  (
    'IT',
    'EU',
    'Italy',
    'ITA',
    '380',
    'Republic of Italy'
  ),
  ('JM', 'NA', 'Jamaica', 'JAM', '388', 'Jamaica'),
  ('JP', 'AS', 'Japan', 'JPN', '392', 'Japan'),
  (
    'JE',
    'EU',
    'Jersey',
    'JEY',
    '832',
    'Bailiwick of Jersey'
  ),
  (
    'JO',
    'AS',
    'Jordan',
    'JOR',
    '400',
    'Hashemite Kingdom of Jordan'
  ),
  (
    'KZ',
    'AS',
    'Kazakhstan',
    'KAZ',
    '398',
    'Republic of Kazakhstan'
  ),
  (
    'KE',
    'AF',
    'Kenya',
    'KEN',
    '404',
    'Republic of Kenya'
  ),
  (
    'KI',
    'OC',
    'Kiribati',
    'KIR',
    '296',
    'Republic of Kiribati'
  ),
  (
    'KP',
    'AS',
    'Korea',
    'PRK',
    '408',
    'Democratic Peoples Republic of Korea'
  ),
  (
    'KR',
    'AS',
    'Korea',
    'KOR',
    '410',
    'Republic of Korea'
  ),
  (
    'KW',
    'AS',
    'Kuwait',
    'KWT',
    '414',
    'State of Kuwait'
  ),
  (
    'KG',
    'AS',
    'Kyrgyz Republic',
    'KGZ',
    '417',
    'Kyrgyz Republic'
  ),
  (
    'LA',
    'AS',
    'Lao Peoples Democratic Republic',
    'LAO',
    '418',
    'Lao Peoples Democratic Republic'
  ),
  (
    'LV',
    'EU',
    'Latvia',
    'LVA',
    '428',
    'Republic of Latvia'
  ),
  (
    'LB',
    'AS',
    'Lebanon',
    'LBN',
    '422',
    'Lebanese Republic'
  ),
  (
    'LS',
    'AF',
    'Lesotho',
    'LSO',
    '426',
    'Kingdom of Lesotho'
  ),
  (
    'LR',
    'AF',
    'Liberia',
    'LBR',
    '430',
    'Republic of Liberia'
  ),
  (
    'LY',
    'AF',
    'Libya',
    'LBY',
    '434',
    'State of Libya'
  ),
  (
    'LI',
    'EU',
    'Liechtenstein',
    'LIE',
    '438',
    'Principality of Liechtenstein'
  ),
  (
    'LT',
    'EU',
    'Lithuania',
    'LTU',
    '440',
    'Republic of Lithuania'
  ),
  (
    'LU',
    'EU',
    'Luxembourg',
    'LUX',
    '442',
    'Grand Duchy of Luxembourg'
  ),
  (
    'MO',
    'AS',
    'Macao',
    'MAC',
    '446',
    'Macao Special Administrative Region of China'
  ),
  (
    'MG',
    'AF',
    'Madagascar',
    'MDG',
    '450',
    'Republic of Madagascar'
  ),
  (
    'MW',
    'AF',
    'Malawi',
    'MWI',
    '454',
    'Republic of Malawi'
  ),
  ('MY', 'AS', 'Malaysia', 'MYS', '458', 'Malaysia'),
  (
    'MV',
    'AS',
    'Maldives',
    'MDV',
    '462',
    'Republic of Maldives'
  ),
  (
    'ML',
    'AF',
    'Mali',
    'MLI',
    '466',
    'Republic of Mali'
  ),
  (
    'MT',
    'EU',
    'Malta',
    'MLT',
    '470',
    'Republic of Malta'
  ),
  (
    'MH',
    'OC',
    'Marshall Islands',
    'MHL',
    '584',
    'Republic of the Marshall Islands'
  ),
  (
    'MQ',
    'NA',
    'Martinique',
    'MTQ',
    '474',
    'Martinique'
  ),
  (
    'MR',
    'AF',
    'Mauritania',
    'MRT',
    '478',
    'Islamic Republic of Mauritania'
  ),
  (
    'MU',
    'AF',
    'Mauritius',
    'MUS',
    '480',
    'Republic of Mauritius'
  ),
  ('YT', 'AF', 'Mayotte', 'MYT', '175', 'Mayotte'),
  (
    'MX',
    'NA',
    'Mexico',
    'MEX',
    '484',
    'United Mexican States'
  ),
  (
    'FM',
    'OC',
    'Micronesia',
    'FSM',
    '583',
    'Federated States of Micronesia'
  ),
  (
    'MD',
    'EU',
    'Moldova',
    'MDA',
    '498',
    'Republic of Moldova'
  ),
  (
    'MC',
    'EU',
    'Monaco',
    'MCO',
    '492',
    'Principality of Monaco'
  ),
  ('MN', 'AS', 'Mongolia', 'MNG', '496', 'Mongolia'),
  (
    'ME',
    'EU',
    'Montenegro',
    'MNE',
    '499',
    'Montenegro'
  ),
  (
    'MS',
    'NA',
    'Montserrat',
    'MSR',
    '500',
    'Montserrat'
  ),
  (
    'MA',
    'AF',
    'Morocco',
    'MAR',
    '504',
    'Kingdom of Morocco'
  ),
  (
    'MZ',
    'AF',
    'Mozambique',
    'MOZ',
    '508',
    'Republic of Mozambique'
  ),
  (
    'MM',
    'AS',
    'Myanmar',
    'MMR',
    '104',
    'Republic of the Union of Myanmar'
  ),
  (
    'NA',
    'AF',
    'Namibia',
    'NAM',
    '516',
    'Republic of Namibia'
  ),
  (
    'NR',
    'OC',
    'Nauru',
    'NRU',
    '520',
    'Republic of Nauru'
  ),
  ('NP', 'AS', 'Nepal', 'NPL', '524', 'Nepal'),
  (
    'NL',
    'EU',
    'Netherlands',
    'NLD',
    '528',
    'Kingdom of the Netherlands'
  ),
  (
    'NC',
    'OC',
    'New Caledonia',
    'NCL',
    '540',
    'New Caledonia'
  ),
  (
    'NZ',
    'OC',
    'New Zealand',
    'NZL',
    '554',
    'New Zealand'
  ),
  (
    'NI',
    'NA',
    'Nicaragua',
    'NIC',
    '558',
    'Republic of Nicaragua'
  ),
  (
    'NE',
    'AF',
    'Niger',
    'NER',
    '562',
    'Republic of Niger'
  ),
  (
    'NG',
    'AF',
    'Nigeria',
    'NGA',
    '566',
    'Federal Republic of Nigeria'
  ),
  ('NU', 'OC', 'Niue', 'NIU', '570', 'Niue'),
  (
    'NF',
    'OC',
    'Norfolk Island',
    'NFK',
    '574',
    'Norfolk Island'
  ),
  (
    'MK',
    'EU',
    'North Macedonia',
    'MKD',
    '807',
    'Republic of North Macedonia'
  ),
  (
    'MP',
    'OC',
    'Northern Mariana Islands',
    'MNP',
    '580',
    'Commonwealth of the Northern Mariana Islands'
  ),
  (
    'NO',
    'EU',
    'Norway',
    'NOR',
    '578',
    'Kingdom of Norway'
  ),
  (
    'OM',
    'AS',
    'Oman',
    'OMN',
    '512',
    'Sultanate of Oman'
  ),
  (
    'PK',
    'AS',
    'Pakistan',
    'PAK',
    '586',
    'Islamic Republic of Pakistan'
  ),
  (
    'PW',
    'OC',
    'Palau',
    'PLW',
    '585',
    'Republic of Palau'
  ),
  (
    'PS',
    'AS',
    'Palestine',
    'PSE',
    '275',
    'State of Palestine'
  ),
  (
    'PA',
    'NA',
    'Panama',
    'PAN',
    '591',
    'Republic of Panama'
  ),
  (
    'PG',
    'OC',
    'Papua New Guinea',
    'PNG',
    '598',
    'Independent State of Papua New Guinea'
  ),
  (
    'PY',
    'SA',
    'Paraguay',
    'PRY',
    '600',
    'Republic of Paraguay'
  ),
  (
    'PE',
    'SA',
    'Peru',
    'PER',
    '604',
    'Republic of Peru'
  ),
  (
    'PH',
    'AS',
    'Philippines',
    'PHL',
    '608',
    'Republic of the Philippines'
  ),
  (
    'PN',
    'OC',
    'Pitcairn Islands',
    'PCN',
    '612',
    'Pitcairn Islands'
  ),
  (
    'PL',
    'EU',
    'Poland',
    'POL',
    '616',
    'Republic of Poland'
  ),
  (
    'PT',
    'EU',
    'Portugal',
    'PRT',
    '620',
    'Portuguese Republic'
  ),
  (
    'PR',
    'NA',
    'Puerto Rico',
    'PRI',
    '630',
    'Commonwealth of Puerto Rico'
  ),
  (
    'QA',
    'AS',
    'Qatar',
    'QAT',
    '634',
    'State of Qatar'
  ),
  ('RE', 'AF', 'Réunion', 'REU', '638', 'Réunion'),
  ('RO', 'EU', 'Romania', 'ROU', '642', 'Romania'),
  (
    'RU',
    'EU',
    'Russian Federation',
    'RUS',
    '643',
    'Russian Federation'
  ),
  (
    'RW',
    'AF',
    'Rwanda',
    'RWA',
    '646',
    'Republic of Rwanda'
  ),
  (
    'BL',
    'NA',
    'Saint Barthélemy',
    'BLM',
    '652',
    'Saint Barthélemy'
  ),
  (
    'SH',
    'AF',
    'Saint Helena, Ascension and Tristan da Cunha',
    'SHN',
    '654',
    'Saint Helena, Ascension and Tristan da Cunha'
  ),
  (
    'KN',
    'NA',
    'Saint Kitts and Nevis',
    'KNA',
    '659',
    'Federation of Saint Kitts and Nevis'
  ),
  (
    'LC',
    'NA',
    'Saint Lucia',
    'LCA',
    '662',
    'Saint Lucia'
  ),
  (
    'MF',
    'NA',
    'Saint Martin',
    'MAF',
    '663',
    'Saint Martin (French part)'
  ),
  (
    'PM',
    'NA',
    'Saint Pierre and Miquelon',
    'SPM',
    '666',
    'Saint Pierre and Miquelon'
  ),
  (
    'VC',
    'NA',
    'Saint Vincent and the Grenadines',
    'VCT',
    '670',
    'Saint Vincent and the Grenadines'
  ),
  (
    'WS',
    'OC',
    'Samoa',
    'WSM',
    '882',
    'Independent State of Samoa'
  ),
  (
    'SM',
    'EU',
    'San Marino',
    'SMR',
    '674',
    'Republic of San Marino'
  ),
  (
    'ST',
    'AF',
    'Sao Tome and Principe',
    'STP',
    '678',
    'Democratic Republic of Sao Tome and Principe'
  ),
  (
    'SA',
    'AS',
    'Saudi Arabia',
    'SAU',
    '682',
    'Kingdom of Saudi Arabia'
  ),
  (
    'SN',
    'AF',
    'Senegal',
    'SEN',
    '686',
    'Republic of Senegal'
  ),
  (
    'RS',
    'EU',
    'Serbia',
    'SRB',
    '688',
    'Republic of Serbia'
  ),
  (
    'SC',
    'AF',
    'Seychelles',
    'SYC',
    '690',
    'Republic of Seychelles'
  ),
  (
    'SL',
    'AF',
    'Sierra Leone',
    'SLE',
    '694',
    'Republic of Sierra Leone'
  ),
  (
    'SG',
    'AS',
    'Singapore',
    'SGP',
    '702',
    'Republic of Singapore'
  ),
  (
    'SX',
    'NA',
    'Sint Maarten (Dutch part)',
    'SXM',
    '534',
    'Sint Maarten (Dutch part)'
  ),
  (
    'SK',
    'EU',
    'Slovakia (Slovak Republic)',
    'SVK',
    '703',
    'Slovakia (Slovak Republic)'
  ),
  (
    'SI',
    'EU',
    'Slovenia',
    'SVN',
    '705',
    'Republic of Slovenia'
  ),
  (
    'SB',
    'OC',
    'Solomon Islands',
    'SLB',
    '090',
    'Solomon Islands'
  ),
  (
    'SO',
    'AF',
    'Somalia',
    'SOM',
    '706',
    'Federal Republic of Somalia'
  ),
  (
    'ZA',
    'AF',
    'South Africa',
    'ZAF',
    '710',
    'Republic of South Africa'
  ),
  (
    'GS',
    'AN',
    'South Georgia and the South Sandwich Islands',
    'SGS',
    '239',
    'South Georgia and the South Sandwich Islands'
  ),
  (
    'SS',
    'AF',
    'South Sudan',
    'SSD',
    '728',
    'Republic of South Sudan'
  ),
  (
    'ES',
    'EU',
    'Spain',
    'ESP',
    '724',
    'Kingdom of Spain'
  ),
  (
    'LK',
    'AS',
    'Sri Lanka',
    'LKA',
    '144',
    'Democratic Socialist Republic of Sri Lanka'
  ),
  (
    'SD',
    'AF',
    'Sudan',
    'SDN',
    '729',
    'Republic of Sudan'
  ),
  (
    'SR',
    'SA',
    'Suriname',
    'SUR',
    '740',
    'Republic of Suriname'
  ),
  (
    'SJ',
    'EU',
    'Svalbard & Jan Mayen Islands',
    'SJM',
    '744',
    'Svalbard & Jan Mayen Islands'
  ),
  (
    'SZ',
    'AF',
    'Eswatini',
    'SWZ',
    '748',
    'Kingdom of Eswatini'
  ),
  (
    'SE',
    'EU',
    'Sweden',
    'SWE',
    '752',
    'Kingdom of Sweden'
  ),
  (
    'CH',
    'EU',
    'Switzerland',
    'CHE',
    '756',
    'Swiss Confederation'
  ),
  (
    'SY',
    'AS',
    'Syrian Arab Republic',
    'SYR',
    '760',
    'Syrian Arab Republic'
  ),
  (
    'TW',
    'AS',
    'Taiwan',
    'TWN',
    '158',
    'Taiwan, Province of China'
  ),
  (
    'TJ',
    'AS',
    'Tajikistan',
    'TJK',
    '762',
    'Republic of Tajikistan'
  ),
  (
    'TZ',
    'AF',
    'Tanzania',
    'TZA',
    '834',
    'United Republic of Tanzania'
  ),
  (
    'TH',
    'AS',
    'Thailand',
    'THA',
    '764',
    'Kingdom of Thailand'
  ),
  (
    'TL',
    'AS',
    'Timor-Leste',
    'TLS',
    '626',
    'Democratic Republic of Timor-Leste'
  ),
  (
    'TG',
    'AF',
    'Togo',
    'TGO',
    '768',
    'Togolese Republic'
  ),
  ('TK', 'OC', 'Tokelau', 'TKL', '772', 'Tokelau'),
  (
    'TO',
    'OC',
    'Tonga',
    'TON',
    '776',
    'Kingdom of Tonga'
  ),
  (
    'TT',
    'NA',
    'Trinidad and Tobago',
    'TTO',
    '780',
    'Republic of Trinidad and Tobago'
  ),
  (
    'TN',
    'AF',
    'Tunisia',
    'TUN',
    '788',
    'Tunisian Republic'
  ),
  (
    'TR',
    'AS',
    'Turkey',
    'TUR',
    '792',
    'Republic of Turkey'
  ),
  (
    'TM',
    'AS',
    'Turkmenistan',
    'TKM',
    '795',
    'Turkmenistan'
  ),
  (
    'TC',
    'NA',
    'Turks and Caicos Islands',
    'TCA',
    '796',
    'Turks and Caicos Islands'
  ),
  ('TV', 'OC', 'Tuvalu', 'TUV', '798', 'Tuvalu'),
  (
    'UG',
    'AF',
    'Uganda',
    'UGA',
    '800',
    'Republic of Uganda'
  ),
  ('UA', 'EU', 'Ukraine', 'UKR', '804', 'Ukraine'),
  (
    'AE',
    'AS',
    'United Arab Emirates',
    'ARE',
    '784',
    'United Arab Emirates'
  ),
  (
    'GB',
    'EU',
    'United Kingdom of Great Britain and Northern Ireland',
    'GBR',
    '826',
    'United Kingdom of Great Britain & Northern Ireland'
  ),
  (
    'US',
    'NA',
    'United States of America',
    'USA',
    '840',
    'United States of America'
  ),
  (
    'UM',
    'OC',
    'United States Minor Outlying Islands',
    'UMI',
    '581',
    'United States Minor Outlying Islands'
  ),
  (
    'VI',
    'NA',
    'United States Virgin Islands',
    'VIR',
    '850',
    'United States Virgin Islands'
  ),
  (
    'UY',
    'SA',
    'Uruguay',
    'URY',
    '858',
    'Eastern Republic of Uruguay'
  ),
  (
    'UZ',
    'AS',
    'Uzbekistan',
    'UZB',
    '860',
    'Republic of Uzbekistan'
  ),
  (
    'VU',
    'OC',
    'Vanuatu',
    'VUT',
    '548',
    'Republic of Vanuatu'
  ),
  (
    'VE',
    'SA',
    'Venezuela',
    'VEN',
    '862',
    'Bolivarian Republic of Venezuela'
  ),
  (
    'VN',
    'AS',
    'Vietnam',
    'VNM',
    '704',
    'Socialist Republic of Vietnam'
  ),
  (
    'WF',
    'OC',
    'Wallis and Futuna',
    'WLF',
    '876',
    'Wallis and Futuna'
  ),
  (
    'EH',
    'AF',
    'Western Sahara',
    'ESH',
    '732',
    'Western Sahara'
  ),
  ('YE', 'AS', 'Yemen', 'YEM', '887', 'Yemen'),
  (
    'ZM',
    'AF',
    'Zambia',
    'ZMB',
    '894',
    'Republic of Zambia'
  ),
  (
    'ZW',
    'AF',
    'Zimbabwe',
    'ZWE',
    '716',
    'Republic of Zimbabwe'
  );
CREATE TABLE public.contact (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid (),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  country char(2) REFERENCES public.country ON DELETE
  SET NULL,
    username text,
    ticket_number numeric,
    golden_ticket boolean,
    tags text [],
    age_range int4range,
    metadata jsonb,
    catchphrase tsvector
);
CREATE TABLE public.contact_note (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid (),
  contact_id uuid NOT NULL REFERENCES public.contact ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  text text NOT NULL
);
INSERT INTO storage.buckets (id, name)
VALUES ('private_contact_files', 'private_contact_files');

create policy public_access on storage.objects for all using (true) with check (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('public_contact_files', 'public_contact_files', true);

CREATE FUNCTION has_low_ticket_number (contact) RETURNS boolean AS $$
SELECT $1.ticket_number < 100;
$$ LANGUAGE sql STABLE;

begin; 
  -- remove the realtime publication
  drop publication if exists supabase_realtime; 

  -- re-create the publication, enable for all tables.
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
commit;